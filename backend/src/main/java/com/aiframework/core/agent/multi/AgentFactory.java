package com.aiframework.core.agent.multi;

import com.aiframework.core.agent.AgentIterationEngine;
import com.aiframework.core.ai.SystemPromptBuilder;
import com.aiframework.core.tool.ToolRegistry;
import com.aiframework.domain.entity.AgentDefinition;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Builds a ready-to-run {@link LlmAgent} for a role: resolves the role's model, advertises the
 * role's tool subset, and primes the shared system-prompt contract. Reuses {@link SystemPromptBuilder}
 * so every agent speaks the same TOOL_CALL / FINAL_ANSWER protocol as the single-agent path (DRY).
 */
@Component
@RequiredArgsConstructor
public class AgentFactory {

    private final AgentIterationEngine iterationEngine;
    private final SystemPromptBuilder systemPromptBuilder;
    private final AgentModelResolver modelResolver;
    private final ToolRegistry toolRegistry;
    private final ObjectMapper objectMapper;

    /**
     * @param streamTokens  whether the agent's answer should stream to the user (true only for the
     *                      synthesizer; workers run silently)
     * @param autoVisualize whether the agent should render its output as HUD panels (true for the
     *                      synthesizer; false for workers so intermediate work does not clutter the HUD)
     */
    public LlmAgent create(AgentDefinition def, boolean streamTokens, boolean autoVisualize) {
        ChatClient client = modelResolver.resolveClient(def);
        List<String> toolDescriptions = describeTools(def.getAllowedTools());
        SystemMessage systemMessage = systemPromptBuilder.build(
                def.getSystemPrompt(), toolDescriptions, "", "", autoVisualize);
        return new LlmAgent(def.getRoleKey(), client, systemMessage,
                def.getMaxIterations(), streamTokens, iterationEngine);
    }

    private List<String> describeTools(List<String> allowedTools) {
        Set<String> allow = allowedTools == null ? Set.of() : Set.copyOf(allowedTools);
        return toolRegistry.getEnabledTools().stream()
                .filter(tool -> allow.isEmpty() || allow.contains(tool.getName()))
                .map(this::describeTool)
                .collect(Collectors.toList());
    }

    private String describeTool(ToolDefinitionEntity tool) {
        String paramsJson;
        try {
            paramsJson = objectMapper.writeValueAsString(tool.getParametersSchema());
        } catch (JsonProcessingException e) {
            paramsJson = String.valueOf(tool.getParametersSchema());
        }
        return String.format("%s: %s | Parameters: %s", tool.getName(), tool.getDescription(), paramsJson);
    }
}
