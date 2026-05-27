package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMResponse;
import com.aiframework.core.ai.LLMService;
import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.service.ConversationService;
import com.aiframework.service.SettingsService;
import com.aiframework.service.memory.SessionMemoryService;
import com.aiframework.service.monitoring.LogStreamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class AgentOrchestrator {

    private static final int DEFAULT_MAX_ITERATIONS = 10;
    private static final String MAX_ITERATIONS_MESSAGE =
            "Maximum iterations reached. Please refine your request.";

    private final LLMService llmService;
    private final AgentMessageBuilder messageBuilder;
    private final ToolCallExecutor toolCallExecutor;
    private final EventBus eventBus;
    private final SettingsService settings;
    private final ConversationService conversationService;
    private final CancellationService cancellationService;
    private final LogStreamService logStreamService;
    private final SessionMemoryService sessionMemoryService;

    @Async
    public void run(String conversationId, List<Message> history, String userMessage, String imageBase64) {
        cancellationService.clear(conversationId);
        logStreamService.agent("ORCHESTRATOR", "◈ AGENT_START conv=" + conversationId.substring(0, 8) + "... query=" + truncate(userMessage, 60));
        publishAgentStart(conversationId, userMessage);
        List<Message> messages = messageBuilder.buildInitialMessages(history, userMessage, imageBase64);

        IterationOutcome outcome = runIterationLoop(conversationId, messages);
        if (outcome == IterationOutcome.EXHAUSTED) {
            logStreamService.warn("ORCHESTRATOR", "⚠ MAX_ITERATIONS reached for conv=" + conversationId.substring(0, 8));
            publishAgentEnd(conversationId, MAX_ITERATIONS_MESSAGE);
        } else if (outcome == IterationOutcome.CANCELLED) {
            logStreamService.warn("ORCHESTRATOR", "⊘ CANCELLED by user for conv=" + conversationId.substring(0, 8));
            publishAgentEnd(conversationId, "Agent execution was cancelled by the user.");
        } else {
            logStreamService.agent("ORCHESTRATOR", "✓ AGENT_END conv=" + conversationId.substring(0, 8));
            triggerMemorySummarization(conversationId);
        }

        cancellationService.clear(conversationId);
    }

    private IterationOutcome runIterationLoop(String conversationId, List<Message> messages) {
        int maxIterations = settings.getInt("agent.max_iterations", DEFAULT_MAX_ITERATIONS);
        for (int i = 0; i < maxIterations; i++) {
            if (cancellationService.isCancelled(conversationId)) {
                return IterationOutcome.CANCELLED;
            }
            IterationOutcome outcome = runSingleIteration(conversationId, messages);
            if (outcome != IterationOutcome.CONTINUE) return outcome;
        }
        return IterationOutcome.EXHAUSTED;
    }

    private IterationOutcome runSingleIteration(String conversationId, List<Message> messages) {
        LLMResponse response = llmService.chat(messages, conversationId);

        if (cancellationService.isCancelled(conversationId)) {
            return IterationOutcome.CANCELLED;
        }

        if (!response.isToolCall()) {
            String content = response.getContent();
            if (content == null || content.isBlank()) {
                // LLM emitted only a mode keyword with no actual text — ask it to try again
                logStreamService.warn("LLM", "⚠ Blank final answer received, nudging model to respond");
                messages.add(new org.springframework.ai.chat.messages.UserMessage(
                        "[SYSTEM] Your last response was empty. Please provide your actual answer now."));
                return IterationOutcome.CONTINUE;
            }
            logStreamService.agent("LLM", "✦ FINAL_ANSWER " + truncate(content, 80));
            publishAgentEnd(conversationId, content);
            return IterationOutcome.DONE;
        }

        logStreamService.agent("LLM", "→ TOOL_INVOKE: " + response.getToolName());
        publishThinkingIfPresent(conversationId, response);
        ToolExecutionResult result = toolCallExecutor.execute(response, conversationId);

        if (cancellationService.isCancelled(conversationId)) {
            return IterationOutcome.CANCELLED;
        }

        if (result.isRequiresUserInput()) {
            return IterationOutcome.PAUSED;
        }
        toolCallExecutor.appendToolExchange(messages, response, result);
        return IterationOutcome.CONTINUE;
    }

    private void publishAgentStart(String conversationId, String userMessage) {
        eventBus.publish(AgentEvent.of(EventType.AGENT_START, conversationId, userMessage));
    }

    private void publishAgentEnd(String conversationId, String content) {
        persistAssistantMessage(conversationId, content);
        eventBus.publish(AgentEvent.of(EventType.AGENT_END, conversationId, content));
    }

    private void persistAssistantMessage(String conversationId, String content) {
        if (content == null || content.isBlank()) return;
        try {
            conversationService.saveMessage(UUID.fromString(conversationId), "assistant", content);
        } catch (Exception e) {
            log.warn("Failed to persist assistant message for conv {}: {}", conversationId, e.getMessage());
        }
    }

    private void publishThinkingIfPresent(String conversationId, LLMResponse response) {
        String reasoning = response.getReasoning();
        if (reasoning != null && !reasoning.isBlank()) {
            logStreamService.agent("LLM", "💭 THINKING: " + truncate(reasoning, 80));
            eventBus.publishThinking(conversationId, reasoning);
        }
    }

    private void triggerMemorySummarization(String conversationId) {
        try {
            sessionMemoryService.summarizeAndSave(UUID.fromString(conversationId));
        } catch (Exception e) {
            log.warn("Memory summarization failed for conv {}: {}", conversationId, e.getMessage());
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    private enum IterationOutcome { CONTINUE, DONE, PAUSED, EXHAUSTED, CANCELLED }
}
