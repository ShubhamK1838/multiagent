package com.aiframework.service.proactive;

import org.springframework.stereotype.Component;

/**
 * Tracks the most recently active conversation ID so proactive alerts
 * know which SSE channel to publish to.
 * Last-written conversation wins; intentional for single-user personal tool use.
 */
@Component
public class ActiveConversationTracker {

    private volatile String activeConversationId;

    public void setActive(String conversationId) {
        this.activeConversationId = conversationId;
    }

    public String getActive() {
        return activeConversationId;
    }
}
