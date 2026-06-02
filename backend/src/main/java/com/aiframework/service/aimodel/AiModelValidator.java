package com.aiframework.service.aimodel;

import com.aiframework.domain.entity.AiModelProvider;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URISyntaxException;

@Component
public class AiModelValidator {

    private static final BigDecimal MIN_TEMP = BigDecimal.ZERO;
    private static final BigDecimal MAX_TEMP = new BigDecimal("2.0");
    private static final int MIN_TOKENS = 1;
    private static final int MAX_TOKENS = 200_000;

    public void validateForCreate(AiModelRequest request) {
        validateName(request.getName());
        validateProvider(request.getProvider());
        validateModelId(request.getModelId());
        validateBaseUrl(request.getProvider(), request.getBaseUrl());
        validateApiKey(request.getProvider(), request.getApiKey());
        validateBedrockRegion(request.getProvider(), request.getAwsRegion());
        validateTemperature(request.getTemperature());
        validateMaxTokens(request.getMaxTokens());
    }

    public void validateForUpdate(AiModelRequest request) {
        if (request.getName() != null) validateName(request.getName());
        if (request.getModelId() != null) validateModelId(request.getModelId());
        if (request.getBaseUrl() != null) validateBaseUrl(request.getProvider(), request.getBaseUrl());
        if (request.getAwsRegion() != null) validateBedrockRegion(AiModelProvider.BEDROCK, request.getAwsRegion());
        if (request.getTemperature() != null) validateTemperature(request.getTemperature());
        if (request.getMaxTokens() != null) validateMaxTokens(request.getMaxTokens());
    }

    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new InvalidAiModelException("Name is required");
        }
    }

    private void validateProvider(AiModelProvider provider) {
        if (provider == null) {
            throw new InvalidAiModelException("Provider is required");
        }
    }

    private void validateModelId(String modelId) {
        if (modelId == null || modelId.isBlank()) {
            throw new InvalidAiModelException("Model ID is required");
        }
    }

    private void validateBaseUrl(AiModelProvider provider, String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            if (provider == AiModelProvider.OPENAI) {
                throw new InvalidAiModelException("Base URL is required for OpenAI-compatible providers");
            }
            return;
        }
        try {
            URI uri = new URI(baseUrl);
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new InvalidAiModelException("Base URL must be an absolute URL (e.g. https://host)");
            }
        } catch (URISyntaxException e) {
            throw new InvalidAiModelException("Base URL is malformed: " + e.getMessage());
        }
    }

    private void validateApiKey(AiModelProvider provider, String apiKey) {
        if (provider == AiModelProvider.OPENAI && (apiKey == null || apiKey.isBlank())) {
            throw new InvalidAiModelException("API key is required for OpenAI-compatible providers");
        }
    }

    private void validateBedrockRegion(AiModelProvider provider, String region) {
        if (provider != AiModelProvider.BEDROCK) return;
        if (region == null || region.isBlank()) {
            throw new InvalidAiModelException("AWS region is required for Bedrock models (e.g. us-east-1)");
        }
    }

    private void validateTemperature(BigDecimal temperature) {
        if (temperature.compareTo(MIN_TEMP) < 0 || temperature.compareTo(MAX_TEMP) > 0) {
            throw new InvalidAiModelException("Temperature must be between 0.0 and 2.0");
        }
    }

    private void validateMaxTokens(Integer maxTokens) {
        if (maxTokens < MIN_TOKENS || maxTokens > MAX_TOKENS) {
            throw new InvalidAiModelException("Max tokens must be between 1 and 200000");
        }
    }
}
