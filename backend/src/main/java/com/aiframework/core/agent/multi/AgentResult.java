package com.aiframework.core.agent.multi;

import lombok.Getter;

/** Outcome of an {@link Agent} executing one task. */
@Getter
public class AgentResult {

    private final boolean success;
    private final String content;
    private final String error;

    private AgentResult(boolean success, String content, String error) {
        this.success = success;
        this.content = content;
        this.error = error;
    }

    public static AgentResult ok(String content) {
        return new AgentResult(true, content, null);
    }

    public static AgentResult fail(String error) {
        return new AgentResult(false, null, error);
    }
}
