package com.aiframework.core.agent.multi;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Per-run context handed to each agent: the conversation, the overall goal, and the shared
 * blackboard + message bus the agent collaborates through.
 */
@Getter
@RequiredArgsConstructor
public class AgentContext {
    private final String conversationId;
    private final String goal;
    private final Blackboard blackboard;
    private final AgentMessageBus messageBus;
}
