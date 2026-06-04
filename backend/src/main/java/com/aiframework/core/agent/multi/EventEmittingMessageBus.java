package com.aiframework.core.agent.multi;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Per-run {@link AgentMessageBus} that records messages and forwards each to the HUD via the
 * {@link SwarmEventPublisher}. Constructed once per turn (carries the conversation id and the
 * run's message log); not a Spring singleton.
 */
public class EventEmittingMessageBus implements AgentMessageBus {

    private final String conversationId;
    private final SwarmEventPublisher events;
    private final List<AgentMessage> log = Collections.synchronizedList(new ArrayList<>());

    public EventEmittingMessageBus(String conversationId, SwarmEventPublisher events) {
        this.conversationId = conversationId;
        this.events = events;
    }

    @Override
    public void post(AgentMessage message) {
        log.add(message);
        events.agentMessage(conversationId, message.from(), message.to(), message.type(), message.content());
    }

    @Override
    public List<AgentMessage> history() {
        synchronized (log) {
            return new ArrayList<>(log);
        }
    }
}
