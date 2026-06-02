package com.aiframework.service.aimodel;

import com.aiframework.domain.entity.AiModelProvider;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
public class AiModelRequest {
    private String name;
    private AiModelProvider provider;
    private String modelId;
    private String baseUrl;
    private String apiKey;
    private String awsRegion;
    private BigDecimal temperature;
    private Integer maxTokens;
    private Boolean isEnabled;
    private Map<String, Object> options;
    private String description;
}
