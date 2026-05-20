package com.aiframework.core.tool;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ToolDefinitionDto {
    private String id;
    private String name;
    private String description;
    private Map<String, Object> parametersSchema;
    private String toolType;
    private Map<String, Object> handlerConfig;
    private boolean enabled;
    private boolean requiresConfirmation;
}
