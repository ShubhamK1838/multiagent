package com.aiframework.service.aimodel;

import com.aiframework.domain.entity.AiModel;
import com.aiframework.domain.entity.AiModelProvider;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.stereotype.Component;

@Component
public class ChatModelFactory {

    private static final String DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

    public ChatModel build(AiModel model) {
        return switch (model.getProvider()) {
            case OPENAI -> buildOpenAi(model);
            case OLLAMA -> buildOllama(model);
        };
    }

    private ChatModel buildOpenAi(AiModel model) {
        OpenAiApi api = OpenAiApi.builder()
                .baseUrl(model.getBaseUrl())
                .apiKey(model.getApiKey())
                .build();

        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(model.getModelId())
                .temperature(model.getTemperature().doubleValue())
                .maxTokens(model.getMaxTokens())
                .build();

        return OpenAiChatModel.builder()
                .openAiApi(api)
                .defaultOptions(options)
                .build();
    }

    private ChatModel buildOllama(AiModel model) {
        OllamaApi api = OllamaApi.builder()
                .baseUrl(resolveOllamaBaseUrl(model))
                .build();

        OllamaOptions options = OllamaOptions.builder()
                .model(model.getModelId())
                .temperature(model.getTemperature().doubleValue())
                .numPredict(model.getMaxTokens())
                .build();

        return OllamaChatModel.builder()
                .ollamaApi(api)
                .defaultOptions(options)
                .build();
    }

    private String resolveOllamaBaseUrl(AiModel model) {
        return (model.getBaseUrl() == null || model.getBaseUrl().isBlank())
                ? DEFAULT_OLLAMA_BASE_URL
                : model.getBaseUrl();
    }

    public boolean supports(AiModelProvider provider) {
        return provider != null;
    }
}
