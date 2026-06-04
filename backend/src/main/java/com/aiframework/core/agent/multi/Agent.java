package com.aiframework.core.agent.multi;

/**
 * A single specialised agent that executes one task within a run. Implementations are created
 * per role by {@link AgentFactory}. Kept deliberately small (ISP) — coordination, messaging, and
 * failure handling live elsewhere.
 */
public interface Agent {

    /** The role this agent fulfils (matches an {@code AgentDefinition.roleKey}). */
    String roleKey();

    /** Runs the task and returns its outcome; must not throw for ordinary task failures. */
    AgentResult execute(AgentTask task, AgentContext context);
}
