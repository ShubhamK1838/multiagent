package com.aiframework.core.agent;

import com.aiframework.core.agent.AgentIterationEngine.IterationContext;
import com.aiframework.core.agent.AgentIterationEngine.IterationOutcome;
import com.aiframework.core.agent.AgentIterationEngine.IterationResult;
import com.aiframework.service.SettingsService;
import com.aiframework.service.monitoring.LogStreamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Single-agent {@link ConversationRunner}: one model reasons and acts in a loop until it produces
 * a final answer. The reason/act loop lives in {@link AgentIterationEngine} and the turn lifecycle
 * in {@link TurnSupport}, both shared with the multi-agent path.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentOrchestrator implements ConversationRunner {

    private static final int DEFAULT_MAX_ITERATIONS = 10;
    private static final String MAX_ITERATIONS_MESSAGE =
            "Maximum iterations reached. Please refine your request.";

    private final AgentMessageBuilder messageBuilder;
    private final AgentIterationEngine iterationEngine;
    private final SettingsService settings;
    private final CancellationService cancellationService;
    private final LogStreamService logStreamService;
    private final TurnSupport turnSupport;

    @Override
    @Async
    public void run(String conversationId, List<Message> history, String userMessage, String imageBase64) {
        cancellationService.clear(conversationId);
        logStreamService.agent("ORCHESTRATOR", "◈ AGENT_START conv=" + shortId(conversationId) + "... query=" + truncate(userMessage, 60));
        turnSupport.publishStart(conversationId, userMessage);
        List<Message> messages = messageBuilder.buildInitialMessages(history, userMessage, imageBase64);

        try {
            IterationResult outcome = iterationEngine.run(IterationContext.builder()
                    .conversationId(conversationId)
                    .messages(messages)
                    .maxIterations(settings.getInt("agent.max_iterations", DEFAULT_MAX_ITERATIONS))
                    .build());

            if (outcome.getOutcome() == IterationOutcome.DONE) {
                logStreamService.agent("ORCHESTRATOR", "✓ AGENT_END conv=" + shortId(conversationId));
                turnSupport.publishEnd(conversationId, outcome.getContent());
                turnSupport.triggerMemory(conversationId);
            } else if (outcome.getOutcome() == IterationOutcome.EXHAUSTED) {
                logStreamService.warn("ORCHESTRATOR", "⚠ MAX_ITERATIONS reached for conv=" + shortId(conversationId));
                turnSupport.publishEnd(conversationId, MAX_ITERATIONS_MESSAGE);
            } else if (outcome.getOutcome() == IterationOutcome.CANCELLED) {
                logStreamService.warn("ORCHESTRATOR", "⊘ CANCELLED by user for conv=" + shortId(conversationId));
                turnSupport.publishEnd(conversationId, "Agent execution was cancelled by the user.");
            } else {
                // PAUSED — a form request was published; the turn resumes on user input.
                logStreamService.agent("ORCHESTRATOR", "⏸ PAUSED (awaiting user input) conv=" + shortId(conversationId));
                turnSupport.triggerMemory(conversationId);
            }
        } catch (Exception e) {
            log.error("Agent run failed for conv {}: {}", conversationId, e.getMessage(), e);
            logStreamService.error("ORCHESTRATOR", "✗ AGENT_FAILED conv=" + shortId(conversationId) + " : " + turnSupport.describeFailure(e));
            turnSupport.publishEnd(conversationId, turnSupport.friendlyError(e));
        } finally {
            cancellationService.clear(conversationId);
        }
    }

    private String shortId(String conversationId) {
        return conversationId.length() >= 8 ? conversationId.substring(0, 8) : conversationId;
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
