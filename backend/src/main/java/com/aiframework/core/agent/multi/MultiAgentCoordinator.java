package com.aiframework.core.agent.multi;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Entry point to the multi-agent run. Loads the enabled team and dispatches to the configured
 * {@link CoordinationStrategy}. Strategies are injected by Spring as a name→bean map, so selection
 * is pure configuration and new topologies require no change here (OCP).
 */
@Slf4j
@Component
public class MultiAgentCoordinator {

    private final Map<String, CoordinationStrategy> strategies;
    private final AgentTeamProvider teamProvider;
    private final MultiAgentSettings settings;

    public MultiAgentCoordinator(Map<String, CoordinationStrategy> strategies,
                                 AgentTeamProvider teamProvider,
                                 MultiAgentSettings settings) {
        this.strategies = strategies;
        this.teamProvider = teamProvider;
        this.settings = settings;
    }

    public String coordinate(GoalContext goal) {
        AgentTeam team = teamProvider.loadTeam();
        if (team.isEmpty()) {
            throw new IllegalStateException("No enabled agents configured for the multi-agent team.");
        }
        CoordinationStrategy strategy = selectStrategy();
        return strategy.coordinate(goal, team);
    }

    private CoordinationStrategy selectStrategy() {
        String name = settings.strategy();
        CoordinationStrategy strategy = strategies.get(name);
        if (strategy == null) {
            log.warn("Coordination strategy '{}' not found; falling back to '{}'",
                    name, MultiAgentSettings.DEFAULT_STRATEGY);
            strategy = strategies.get(MultiAgentSettings.DEFAULT_STRATEGY);
        }
        if (strategy == null) {
            throw new IllegalStateException("No coordination strategy available (looked for '" + name + "').");
        }
        return strategy;
    }
}
