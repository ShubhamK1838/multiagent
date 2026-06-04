package com.aiframework.core.agent.multi;

import com.aiframework.domain.entity.AgentDefinition;

import java.util.List;
import java.util.Optional;

/**
 * The set of enabled agent roles participating in a run, with convenience lookups for the
 * orchestration roles. Worker roles are everything that is not planner/critic/synthesizer.
 */
public record AgentTeam(List<AgentDefinition> members) {

    public Optional<AgentDefinition> byRole(String roleKey) {
        return members.stream().filter(m -> m.getRoleKey().equals(roleKey)).findFirst();
    }

    public Optional<AgentDefinition> planner() {
        return byRole(AgentRole.PLANNER.key());
    }

    public Optional<AgentDefinition> critic() {
        return byRole(AgentRole.CRITIC.key());
    }

    public Optional<AgentDefinition> synthesizer() {
        return byRole(AgentRole.SYNTHESIZER.key());
    }

    public List<AgentDefinition> workers() {
        return members.stream()
                .filter(m -> AgentRole.isWorkerRole(m.getRoleKey()))
                .toList();
    }

    /** Resolves the worker for a task's role, falling back to the first available worker. */
    public Optional<AgentDefinition> workerFor(String roleKey) {
        Optional<AgentDefinition> exact = byRole(roleKey).filter(m -> AgentRole.isWorkerRole(m.getRoleKey()));
        if (exact.isPresent()) return exact;
        return workers().stream().findFirst();
    }

    public boolean isEmpty() {
        return members.isEmpty();
    }
}
