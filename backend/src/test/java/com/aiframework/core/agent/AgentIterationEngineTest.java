package com.aiframework.core.agent;

import com.aiframework.core.agent.AgentIterationEngine.IterationContext;
import com.aiframework.core.agent.AgentIterationEngine.IterationOutcome;
import com.aiframework.core.agent.AgentIterationEngine.IterationResult;
import com.aiframework.core.ai.LLMResponse;
import com.aiframework.core.ai.LLMService;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.service.monitoring.LogStreamService;
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
class AgentIterationEngineTest {

    @Mock LLMService llmService;
    @Mock ToolCallExecutor toolCallExecutor;
    @Mock CancellationService cancellationService;
    @Mock LogStreamService logStreamService;
    @Mock EventBus eventBus;

    private final String CONV_ID = UUID.randomUUID().toString();

    private AgentIterationEngine engine() {
        return new AgentIterationEngine(llmService, toolCallExecutor, cancellationService, logStreamService, eventBus);
    }

    private IterationContext ctx(int maxIterations) {
        return IterationContext.builder()
                .conversationId(CONV_ID)
                .messages(new ArrayList<>())
                .maxIterations(maxIterations)
                .build();
    }

    @Test
    void finalAnswerOnFirstIteration_returnsDoneWithContent() {
        when(llmService.chat(any(), eq(CONV_ID))).thenReturn(LLMResponse.finalAnswer("Here is my answer."));

        IterationResult result = engine().run(ctx(10));

        assertEquals(IterationOutcome.DONE, result.getOutcome());
        assertEquals("Here is my answer.", result.getContent());
    }

    @Test
    void toolCallThenFinalAnswer_executesToolThenCompletes() {
        LLMResponse toolCall = LLMResponse.toolCall("listing", "list_files", Map.of("path", "/home"));
        LLMResponse finalAnswer = LLMResponse.finalAnswer("Files: a.txt, b.txt");
        when(llmService.chat(any(), eq(CONV_ID))).thenReturn(toolCall).thenReturn(finalAnswer);
        when(toolCallExecutor.execute(eq(toolCall), eq(CONV_ID)))
                .thenReturn(ToolExecutionResult.success("[\"a.txt\",\"b.txt\"]"));

        IterationResult result = engine().run(ctx(10));

        assertEquals(IterationOutcome.DONE, result.getOutcome());
        assertTrue(result.getContent().contains("a.txt"));
        verify(toolCallExecutor, times(1)).execute(eq(toolCall), eq(CONV_ID));
        verify(toolCallExecutor, times(1)).appendToolExchange(any(), eq(toolCall), any());
    }

    @Test
    void toolError_continuesAndCompletes() {
        LLMResponse toolCall = LLMResponse.toolCall("trying", "bad_tool", Map.of());
        LLMResponse finalAnswer = LLMResponse.finalAnswer("Could not complete.");
        when(llmService.chat(any(), eq(CONV_ID))).thenReturn(toolCall).thenReturn(finalAnswer);
        when(toolCallExecutor.execute(eq(toolCall), eq(CONV_ID)))
                .thenReturn(ToolExecutionResult.error("Tool not found"));

        IterationResult result = engine().run(ctx(10));

        assertEquals(IterationOutcome.DONE, result.getOutcome());
        verify(toolCallExecutor, times(1)).appendToolExchange(any(), eq(toolCall), any());
    }

    @Test
    void maxIterationsReached_returnsExhausted() {
        LLMResponse toolCall = LLMResponse.toolCall("doing", "list_files", Map.of());
        when(llmService.chat(any(), eq(CONV_ID))).thenReturn(toolCall);
        when(toolCallExecutor.execute(any(), any())).thenReturn(ToolExecutionResult.success("result"));

        IterationResult result = engine().run(ctx(3));

        assertEquals(IterationOutcome.EXHAUSTED, result.getOutcome());
        verify(llmService, times(3)).chat(any(), eq(CONV_ID));
    }

    @Test
    void cancellation_stopsLoop() {
        // false at loop-start, true right after the model returns → CANCELLED before tool execution.
        when(cancellationService.isCancelled(CONV_ID)).thenReturn(false).thenReturn(true);
        when(llmService.chat(any(), eq(CONV_ID)))
                .thenReturn(LLMResponse.toolCall("r", "list_files", Map.of()));

        IterationResult result = engine().run(ctx(10));

        assertEquals(IterationOutcome.CANCELLED, result.getOutcome());
        verify(toolCallExecutor, never()).execute(any(), any());
    }

    @Test
    void requiresUserInput_pausesLoop() {
        LLMResponse toolCall = LLMResponse.toolCall("r", "ask_user", Map.of());
        when(llmService.chat(any(), eq(CONV_ID))).thenReturn(toolCall);
        when(toolCallExecutor.execute(eq(toolCall), eq(CONV_ID)))
                .thenReturn(ToolExecutionResult.formRequest("form-123"));

        IterationResult result = engine().run(ctx(10));

        assertEquals(IterationOutcome.PAUSED, result.getOutcome());
        verify(llmService, times(1)).chat(any(), eq(CONV_ID));
    }

    @Test
    void blankFinalAnswer_nudgesThenCompletes() {
        when(llmService.chat(any(), eq(CONV_ID)))
                .thenReturn(LLMResponse.finalAnswer(""))
                .thenReturn(LLMResponse.finalAnswer("Now answered."));

        List<Message> messages = new ArrayList<>();
        IterationResult result = engine().run(IterationContext.builder()
                .conversationId(CONV_ID).messages(messages).maxIterations(10).build());

        assertEquals(IterationOutcome.DONE, result.getOutcome());
        assertEquals("Now answered.", result.getContent());
        // The blank response appended a nudge message before retrying.
        assertFalse(messages.isEmpty());
    }
}
