package com.aiframework.core.agent.multi;

import com.aiframework.core.agent.CancellationService;
import com.aiframework.core.agent.ConversationRunner;
import com.aiframework.core.agent.TurnSupport;
import com.aiframework.service.monitoring.LogStreamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Multi-agent {@link ConversationRunner}: delegates the turn to the {@link MultiAgentCoordinator},
 * which decomposes the goal across a team of agents. Emits the same AGENT_START / AGENT_END
 * lifecycle as the single-agent path (via {@link TurnSupport}), so the final answer flows out
 * through the unchanged streaming + visualization pipeline.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MultiAgentRunner implements ConversationRunner {

    private final MultiAgentCoordinator coordinator;
    private final CancellationService cancellationService;
    private final LogStreamService logStreamService;
    private final TurnSupport turnSupport;

    @Override
    @Async
    public void run(String conversationId, List<Message> history, String userMessage, String imageBase64) {
        cancellationService.clear(conversationId);
        logStreamService.agent("SWARM", "◈ MULTI_AGENT_START conv=" + shortId(conversationId)
                + "... query=" + truncate(userMessage, 60));
        turnSupport.publishStart(conversationId, userMessage);

        try {
            String answer = coordinator.coordinate(new GoalContext(conversationId, userMessage, history));

            if (cancellationService.isCancelled(conversationId)) {
                logStreamService.warn("SWARM", "⊘ CANCELLED by user for conv=" + shortId(conversationId));
                turnSupport.publishEnd(conversationId, "Agent execution was cancelled by the user.");
                return;
            }
            logStreamService.agent("SWARM", "✓ MULTI_AGENT_END conv=" + shortId(conversationId));
            turnSupport.publishEnd(conversationId, answer);
            turnSupport.triggerMemory(conversationId);
        } catch (Exception e) {
            log.error("Multi-agent run failed for conv {}: {}", conversationId, e.getMessage(), e);
            logStreamService.error("SWARM", "✗ MULTI_AGENT_FAILED conv=" + shortId(conversationId)
                    + " : " + turnSupport.describeFailure(e));
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
