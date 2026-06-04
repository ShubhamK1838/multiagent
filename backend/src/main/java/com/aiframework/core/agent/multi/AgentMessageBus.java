package com.aiframework.core.agent.multi;

import java.util.List;

/**
 * The channel agents use to communicate. Agents depend on this abstraction rather than on each
 * other (DIP), which keeps the topology pluggable and makes the conversation observable.
 */
public interface AgentMessageBus {

    /** Posts a message; implementations also surface it to the UI. */
    void post(AgentMessage message);

    /** Full message history for this run, in order. */
    List<AgentMessage> history();
}
