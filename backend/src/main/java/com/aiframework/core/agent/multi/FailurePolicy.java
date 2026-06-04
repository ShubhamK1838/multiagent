package com.aiframework.core.agent.multi;

/**
 * Decides how the coordinator reacts to a failed task. Pluggable (Strategy) so resilience
 * behaviour can evolve without touching the coordination logic.
 */
public interface FailurePolicy {

    /**
     * @param task       the task that just failed
     * @param result     the failing result
     * @param attempt    how many times this task has been attempted (1-based)
     * @param maxRetries configured retry budget
     */
    FailureDecision decide(AgentTask task, AgentResult result, int attempt, int maxRetries);
}
