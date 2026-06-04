package com.aiframework.core.agent.multi;

import com.aiframework.domain.entity.AgentDefinition;
import com.aiframework.service.aimodel.AiModelService;
import com.aiframework.service.aimodel.ChatClientProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

/**
 * Resolves the {@link ChatClient} and a human-readable model label for an agent role, falling
 * back to the default model when the role has no model bound. Centralised so both the agentic
 * factory and the single-shot reasoner share one resolution path (DRY/SRP).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentModelResolver {

    private final ChatClientProvider chatClientProvider;
    private final AiModelService aiModelService;

    public ChatClient resolveClient(AgentDefinition def) {
        if (def.getModelId() != null) {
            try {
                return chatClientProvider.getForModel(def.getModelId());
            } catch (Exception e) {
                log.warn("Model {} for role {} unavailable, using default: {}",
                        def.getModelId(), def.getRoleKey(), e.getMessage());
            }
        }
        return chatClientProvider.getDefault();
    }

    public String modelLabel(AgentDefinition def) {
        if (def.getModelId() == null) return "default";
        try {
            return aiModelService.getById(def.getModelId()).getName();
        } catch (Exception e) {
            return "default";
        }
    }
}
