package com.aiframework.api.dto;

import com.aiframework.domain.entity.AiModel;
import com.aiframework.domain.entity.AiModelProvider;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class AiModelResponse {

    private UUID id;
    private String name;
    private AiModelProvider provider;
    private String modelId;
    private String baseUrl;
    private boolean hasApiKey;
    private String awsRegion;
    private BigDecimal temperature;
    private Integer maxTokens;
    private boolean isDefault;
    private boolean isEnabled;
    private Map<String, Object> options;
    private String description;
    private Instant createdAt;
    private Instant updatedAt;

    public static AiModelResponse from(AiModel model) {
        return AiModelResponse.builder()
                .id(model.getId())
                .name(model.getName())
                .provider(model.getProvider())
                .modelId(model.getModelId())
                .baseUrl(model.getBaseUrl())
                .hasApiKey(model.getApiKey() != null && !model.getApiKey().isBlank())
                .awsRegion(model.getAwsRegion())
                .temperature(model.getTemperature())
                .maxTokens(model.getMaxTokens())
                .isDefault(model.isDefault())
                .isEnabled(model.isEnabled())
                .options(model.getOptions())
                .description(model.getDescription())
                .createdAt(model.getCreatedAt())
                .updatedAt(model.getUpdatedAt())
                .build();
    }
}
