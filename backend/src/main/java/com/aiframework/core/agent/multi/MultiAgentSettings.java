package com.aiframework.core.agent.multi;

import com.aiframework.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Typed, single-source accessor for multi-agent configuration. Keeps the string setting keys in
 * one place rather than scattered across the coordination code (SRP).
 */
@Component
@RequiredArgsConstructor
public class MultiAgentSettings {

    public static final String KEY_ENABLED = "agent.multi.enabled";
    public static final String KEY_STRATEGY = "agent.multi.strategy";
    public static final String KEY_MAX_AGENTS = "agent.multi.max_agents";
    public static final String KEY_MAX_ROUNDS = "agent.multi.max_rounds";
    public static final String KEY_MAX_RETRIES = "agent.multi.max_retries";

    public static final String DEFAULT_STRATEGY = "orchestrator_worker";

    private final SettingsService settings;

    public boolean isEnabled() {
        return settings.getBoolean(KEY_ENABLED, false);
    }

    public String strategy() {
        return settings.get(KEY_STRATEGY, DEFAULT_STRATEGY);
    }

    public int maxAgents() {
        return settings.getInt(KEY_MAX_AGENTS, 5);
    }

    public int maxRounds() {
        return settings.getInt(KEY_MAX_ROUNDS, 3);
    }

    public int maxRetries() {
        return settings.getInt(KEY_MAX_RETRIES, 2);
    }
}
