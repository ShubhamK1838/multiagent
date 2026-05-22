package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMResponse;
import com.aiframework.core.ai.LLMService;
import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.service.ConversationService;
import com.aiframework.service.SettingsService;
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

    @Async
    public void run(String conversationId, List<Message> history, String userMessage) {
        cancellationService.clear(conversationId);
        publishAgentStart(conversationId, userMessage);
        List<Message> messages = messageBuilder.buildInitialMessages(history, userMessage);

        IterationOutcome outcome = runIterationLoop(conversationId, messages);
        if (outcome == IterationOutcome.EXHAUSTED) {
            publishAgentEnd(conversationId, MAX_ITERATIONS_MESSAGE);
        } else if (outcome == IterationOutcome.CANCELLED) {
            publishAgentEnd(conversationId, "Agent execution was cancelled by the user.");
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
            publishAgentEnd(conversationId, response.getContent());
            return IterationOutcome.DONE;
        }

        publishThinkingIfPresent(conversationId, response);
        ToolExecutionResult result = toolCallExecutor.execute(response, conversationId, messages);

        if (cancellationService.isCancelled(conversationId)) {
            return IterationOutcome.CANCELLED;
        }

        if (result == null) {
            return IterationOutcome.CONTINUE; // unknown tool, model will retry
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
            eventBus.publishThinking(conversationId, reasoning);
        }
    }

    private enum IterationOutcome { CONTINUE, DONE, PAUSED, EXHAUSTED, CANCELLED }
}
