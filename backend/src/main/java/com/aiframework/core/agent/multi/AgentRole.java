package com.aiframework.core.agent.multi;

/**
 * Well-known roles in the orchestrator-worker topology. Stored as the {@code role_key} of an
 * {@code AgentDefinition}. Custom roles may exist beyond these; any role that is not PLANNER,
 * CRITIC, or SYNTHESIZER is treated as a worker.
 */
public enum AgentRole {
    /** Decomposes the goal into a task plan. */
    PLANNER,
    /** Gathers information needed by the plan. */
    RESEARCHER,
    /** Performs actions / produces concrete outputs. */
    EXECUTOR,
    /** Reviews aggregated results and may request follow-up work. */
    CRITIC,
    /** Composes the final user-facing answer. */
    SYNTHESIZER;

    public String key() {
        return name();
    }

    /** Worker roles carry out plan tasks; the orchestration roles drive the loop. */
    public static boolean isWorkerRole(String roleKey) {
        return !PLANNER.name().equals(roleKey)
                && !CRITIC.name().equals(roleKey)
                && !SYNTHESIZER.name().equals(roleKey);
    }
}
