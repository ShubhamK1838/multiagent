package com.aiframework.service.agent;

import lombok.Data;

import java.util.List;
import java.util.UUID;

/** Create/update payload for an {@link com.aiframework.domain.entity.AgentDefinition} role. */
@Data
public class AgentDefinitionRequest {
    private String roleKey;
    private String displayName;
    private String systemPrompt;
    private UUID modelId;
    private List<String> allowedTools;
    private Integer maxIterations;
    private String color;
    private Integer sortOrder;
    private Boolean enabled;
}
