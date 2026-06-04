package com.aiframework.core.agent.multi;

import java.time.Instant;

/**
 * One internal message exchanged between agents via the {@link AgentMessageBus}.
 *
 * @param from    role that sent the message
 * @param to      target role, or {@code null} for a broadcast
 * @param type    PROPOSAL | RESULT | CRITIQUE | HANDOFF | QUESTION | ANSWER
 * @param content message body
 * @param at      when it was sent
 */
public record AgentMessage(String from, String to, String type, String content, Instant at) {

    public static AgentMessage of(String from, String to, String type, String content) {
        return new AgentMessage(from, to, type, content, Instant.now());
    }
}
