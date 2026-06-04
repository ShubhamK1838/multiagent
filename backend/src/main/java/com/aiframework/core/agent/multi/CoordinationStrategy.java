package com.aiframework.core.agent.multi;

/**
 * A topology for coordinating a team of agents toward a goal. Implementations are Spring beans
 * keyed by name (e.g. {@code "orchestrator_worker"}); selecting a strategy is configuration, and
 * adding a new one requires no change to the coordinator (OCP).
 */
public interface CoordinationStrategy {

    /**
     * Drives the team to fully satisfy the goal and returns the final user-facing answer.
     *
     * @param goal the run input
     * @param team the enabled agent roster
     * @return the composed final answer (markdown / pointer to rendered panels)
     */
    String coordinate(GoalContext goal, AgentTeam team);
}
