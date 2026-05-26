package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMResponse;
import com.aiframework.core.ai.LLMService;
import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.service.ConversationService;
import com.aiframework.service.SettingsService;
import com.aiframework.service.memory.SessionMemoryService;
import com.aiframework.service.monitoring.LogStreamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.messages.Message;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AgentOrchestratorTest {

    @Mock LLMService llmService;
    @Mock AgentMessageBuilder messageBuilder;
    @Mock ToolCallExecutor toolCallExecutor;
    @Mock EventBus eventBus;
    @Mock SettingsService settings;
    @Mock ConversationService conversationService;
    @Mock CancellationService cancellationService;
    @Mock LogStreamService logStreamService;
    @Mock SessionMemoryService sessionMemoryService;

    private AgentOrchestrator orchestrator;
    private final String CONV_ID = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        orchestrator = new AgentOrchestrator(
                llmService, messageBuilder, toolCallExecutor,
                eventBus, settings, conversationService,
                cancellationService, logStreamService, sessionMemoryService);

        when(settings.getInt(eq("agent.max_iterations"), anyInt())).thenReturn(10);
        // isCancelled returns boolean — Mockito default is false, so no stub needed
        // unless a test needs specific cancellation behaviour (see cancellation_stopsLoop)
        when(messageBuilder.buildInitialMessages(any(), anyString(), any()))
                .thenReturn(new ArrayList<>(List.of()));
    }

    @Test
    void finalAnswerOnFirstIteration_publishesAgentEndOnce() {
        LLMResponse finalAnswer = LLMResponse.finalAnswer("Here is my answer.");
        when(llmService.chat(any(), eq(CONV_ID))).thenReturn(finalAnswer);

        orchestrator.run(CONV_ID, List.of(), "hello", null);

        // AGENT_END published once with the content
        verify(eventBus, times(1)).publish(argThat(e ->
                e.getType().name().equals("AGENT_END") &&
                "Here is my answer.".equals(e.getContent())));
    }

    @Test
    void toolCallFollowedByFinalAnswer_executesToolThenPublishesEnd() {
        LLMResponse toolCall = LLMResponse.toolCall("listing", "list_files", Map.of("path", "/home"));
        LLMResponse finalAnswer = LLMResponse.finalAnswer("Here are your files: a.txt, b.txt");

        when(llmService.chat(any(), eq(CONV_ID)))
                .thenReturn(toolCall)
                .thenReturn(finalAnswer);
        when(toolCallExecutor.execute(eq(toolCall), eq(CONV_ID)))
                .thenReturn(ToolExecutionResult.success("[\"a.txt\",\"b.txt\"]"));

        orchestrator.run(CONV_ID, List.of(), "show my files", null);

        // Tool was executed once
        verify(toolCallExecutor, times(1)).execute(eq(toolCall), eq(CONV_ID));
        // Tool exchange appended to messages
        verify(toolCallExecutor, times(1)).appendToolExchange(any(), eq(toolCall), any());
        // AGENT_END published with the final answer
        verify(eventBus, times(1)).publish(argThat(e ->
                e.getType().name().equals("AGENT_END") &&
                e.getContent().contains("a.txt")));
    }

    @Test
    void toolCallError_agentContinuesAndGivesFinalAnswer() {
        LLMResponse toolCall = LLMResponse.toolCall("trying", "bad_tool", Map.of());
        LLMResponse finalAnswer = LLMResponse.finalAnswer("Could not complete the request.");

        when(llmService.chat(any(), eq(CONV_ID)))
                .thenReturn(toolCall)
                .thenReturn(finalAnswer);
        when(toolCallExecutor.execute(eq(toolCall), eq(CONV_ID)))
                .thenReturn(ToolExecutionResult.error("Tool not found"));

        orchestrator.run(CONV_ID, List.of(), "do something", null);

        // Even with tool error the orchestrator continues
        verify(toolCallExecutor, times(1)).appendToolExchange(any(), eq(toolCall), any());
        verify(eventBus, atLeastOnce()).publish(argThat(e ->
                e.getType().name().equals("AGENT_END")));
    }

    @Test
    void maxIterationsReached_publishesAgentEndWithMaxIterationsMessage() {
        // LLM always returns a tool call — never terminates on its own
        LLMResponse toolCall = LLMResponse.toolCall("doing", "list_files", Map.of());
        when(settings.getInt(eq("agent.max_iterations"), anyInt())).thenReturn(3);
        when(llmService.chat(any(), eq(CONV_ID))).thenReturn(toolCall);
        when(toolCallExecutor.execute(any(), any()))
                .thenReturn(ToolExecutionResult.success("result"));

        orchestrator.run(CONV_ID, List.of(), "loop forever", null);

        // LLM called exactly 3 times (max iterations)
        verify(llmService, times(3)).chat(any(), eq(CONV_ID));
        // AGENT_END published with max-iterations message
        verify(eventBus, times(1)).publish(argThat(e ->
                e.getType().name().equals("AGENT_END") &&
                e.getContent().contains("Maximum iterations")));
    }

    @Test
    void cancellation_stopsLoop() {
        when(cancellationService.isCancelled(CONV_ID))
                .thenReturn(false)
                .thenReturn(true);  // Cancel after first check
        LLMResponse toolCall = LLMResponse.toolCall("r", "list_files", Map.of());
        when(llmService.chat(any(), eq(CONV_ID))).thenReturn(toolCall);
        when(toolCallExecutor.execute(any(), any())).thenReturn(ToolExecutionResult.success("[]"));

        orchestrator.run(CONV_ID, List.of(), "cancel test", null);

        // AGENT_END published with cancellation message
        verify(eventBus, atLeastOnce()).publish(argThat(e ->
                e.getType().name().equals("AGENT_END") &&
                e.getContent().contains("cancelled")));
    }

    @Test
    void agentStartPublishedAtBeginning() {
        when(llmService.chat(any(), eq(CONV_ID)))
                .thenReturn(LLMResponse.finalAnswer("hi"));

        orchestrator.run(CONV_ID, List.of(), "hello", null);

        verify(eventBus, times(1)).publish(argThat(e ->
                e.getType().name().equals("AGENT_START")));
    }

    @Test
    void assistantMessagePersistedToDB() {
        when(llmService.chat(any(), eq(CONV_ID)))
                .thenReturn(LLMResponse.finalAnswer("Saved answer."));

        orchestrator.run(CONV_ID, List.of(), "hello", null);

        verify(conversationService, times(1))
                .saveMessage(eq(UUID.fromString(CONV_ID)), eq("assistant"), eq("Saved answer."));
    }

    @Test
    void emptyFinalAnswer_notPersistedToDB() {
        when(llmService.chat(any(), eq(CONV_ID)))
                .thenReturn(LLMResponse.finalAnswer(""));

        orchestrator.run(CONV_ID, List.of(), "hello", null);

        verify(conversationService, never()).saveMessage(any(), any(), any());
    }

    @Test
    void requiresUserInput_pausesLoop() {
        LLMResponse toolCall = LLMResponse.toolCall("r", "ask_user", Map.of());
        when(llmService.chat(any(), eq(CONV_ID))).thenReturn(toolCall);
        when(toolCallExecutor.execute(eq(toolCall), eq(CONV_ID)))
                .thenReturn(ToolExecutionResult.formRequest("form-123"));

        orchestrator.run(CONV_ID, List.of(), "need more info", null);

        // Should have called execute once then stopped (PAUSED)
        verify(llmService, times(1)).chat(any(), eq(CONV_ID));
        // No AGENT_END when paused
        verify(eventBus, never()).publish(argThat(e ->
                e.getType().name().equals("AGENT_END")));
    }
}
