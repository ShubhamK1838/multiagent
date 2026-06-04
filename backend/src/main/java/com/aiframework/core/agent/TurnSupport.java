package com.aiframework.core.agent;

import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import com.aiframework.service.ConversationService;
import com.aiframework.service.memory.SessionMemoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.TimeoutException;

/**
 * Shared turn-lifecycle plumbing for every {@link ConversationRunner}: AGENT_START / AGENT_END
 * publication, assistant-message persistence, memory summarization, and user-facing error
 * formatting. Extracted so the single- and multi-agent runners stay DRY.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TurnSupport {

    private final EventBus eventBus;
    private final ConversationService conversationService;
    private final SessionMemoryService sessionMemoryService;

    public void publishStart(String conversationId, String userMessage) {
        eventBus.publish(AgentEvent.of(EventType.AGENT_START, conversationId, userMessage));
    }

    public void publishEnd(String conversationId, String content) {
        persistAssistantMessage(conversationId, content);
        eventBus.publish(AgentEvent.of(EventType.AGENT_END, conversationId, content));
    }

    public void triggerMemory(String conversationId) {
        try {
            sessionMemoryService.summarizeAndSave(UUID.fromString(conversationId));
        } catch (Exception e) {
            log.warn("Memory summarization failed for conv {}: {}", conversationId, e.getMessage());
        }
    }

    public String friendlyError(Throwable e) {
        if (isTimeout(e)) {
            return "The model did not respond in time and the request timed out. "
                    + "It may be under heavy load or unreachable — please try again.";
        }
        return "Something went wrong while contacting the model: " + describeFailure(e) + ". Please try again.";
    }

    public String describeFailure(Throwable e) {
        Throwable root = e;
        while (root.getCause() != null && root.getCause() != root) root = root.getCause();
        String msg = root.getMessage();
        return msg != null && !msg.isBlank() ? truncate(msg, 120) : root.getClass().getSimpleName();
    }

    private void persistAssistantMessage(String conversationId, String content) {
        if (content == null || content.isBlank()) return;
        try {
            conversationService.saveMessage(UUID.fromString(conversationId), "assistant", content);
        } catch (Exception e) {
            log.warn("Failed to persist assistant message for conv {}: {}", conversationId, e.getMessage());
        }
    }

    private boolean isTimeout(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof TimeoutException) return true;
            if (t == t.getCause()) break;
        }
        return false;
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
