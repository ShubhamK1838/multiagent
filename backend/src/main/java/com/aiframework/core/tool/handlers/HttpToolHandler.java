package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class HttpToolHandler {

    private final WebClient.Builder webClientBuilder;

    public ToolExecutionResult execute(ToolDefinitionEntity tool, Map<String, Object> args) {
        Map<String, Object> config = tool.getHandlerConfig();
        String url = interpolate((String) config.get("url"), args);
        String method = (String) config.getOrDefault("method", "GET");

        try {
            String response = webClientBuilder.build()
                    .method(HttpMethod.valueOf(method))
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            return ToolExecutionResult.success(response);
        } catch (Exception e) {
            return ToolExecutionResult.error("HTTP request failed: " + e.getMessage());
        }
    }

    private String interpolate(String template, Map<String, Object> vars) {
        String result = template;
        for (Map.Entry<String, Object> entry : vars.entrySet()) {
            result = result.replace("${" + entry.getKey() + "}", String.valueOf(entry.getValue()));
        }
        return result;
    }
}
