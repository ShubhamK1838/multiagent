package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Generic HTTP tool. The tool's {@code handlerConfig} JSONB column supports:
 * <pre>
 * {
 *   "url":         "https://api.example.com/v1/search",     // required, interpolated
 *   "method":      "GET",                                    // default GET
 *   "headers":     { "Authorization": "Bearer ${api_key}" }, // optional, values interpolated
 *   "queryParams": { "q": "${query}", "limit": "10" },       // optional, values interpolated
 *   "body":        "{ \"prompt\": \"${query}\" }",          // optional, interpolated raw string
 *   "contentType": "application/json",                       // optional, default application/json
 *   "timeoutMs":   10000                                     // optional
 * }
 * </pre>
 * Placeholders of the form {@code ${argName}} are replaced with the tool-call
 * arguments. Values are URL-encoded automatically for query parameters.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HttpToolHandler {

    private static final Set<String> METHODS_WITH_BODY = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final WebClient.Builder webClientBuilder;

    public ToolExecutionResult execute(ToolDefinitionEntity tool, Map<String, Object> args) {
        Map<String, Object> config = tool.getHandlerConfig() != null ? tool.getHandlerConfig() : new HashMap<>();
        try {
            String response = invoke(config, args);
            return ToolExecutionResult.success(response);
        } catch (Exception e) {
            log.warn("HTTP tool '{}' failed: {}", tool.getName(), e.getMessage());
            return ToolExecutionResult.error("HTTP request failed: " + e.getMessage());
        }
    }

    private String invoke(Map<String, Object> config, Map<String, Object> args) {
        String url = resolveUrl(config, args);
        HttpMethod method = resolveMethod(config);
        Map<String, String> headers = stringMap(config.get("headers"), args);
        String contentType = (String) config.getOrDefault("contentType", "application/json");

        WebClient.RequestBodySpec request = webClientBuilder.build()
                .method(method)
                .uri(url)
                .headers(h -> headers.forEach(h::add));

        if (METHODS_WITH_BODY.contains(method.name())) {
            String body = interpolate((String) config.get("body"), args);
            if (body != null && !body.isBlank()) {
                request = (WebClient.RequestBodySpec) request
                        .header("Content-Type", contentType)
                        .body(BodyInserters.fromValue(body));
            }
        }

        return request.retrieve()
                .bodyToMono(String.class)
                .block();
    }

    private String resolveUrl(Map<String, Object> config, Map<String, Object> args) {
        String url = interpolate((String) config.get("url"), args);
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("Tool handlerConfig.url is required");
        }
        Map<String, String> queryParams = stringMap(config.get("queryParams"), args);
        if (queryParams.isEmpty()) return url;
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(url);
        queryParams.forEach(builder::queryParam);
        return builder.encode().toUriString();
    }

    private HttpMethod resolveMethod(Map<String, Object> config) {
        String method = String.valueOf(config.getOrDefault("method", "GET")).toUpperCase();
        return HttpMethod.valueOf(method);
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> stringMap(Object raw, Map<String, Object> args) {
        Map<String, String> out = new HashMap<>();
        if (!(raw instanceof Map<?, ?> m)) return out;
        for (Map.Entry<?, ?> e : m.entrySet()) {
            if (e.getKey() == null || e.getValue() == null) continue;
            String key = String.valueOf(e.getKey()).trim();
            String value = interpolate(String.valueOf(e.getValue()), args);
            if (!key.isBlank() && value != null) {
                out.put(key, value);
            }
        }
        return out;
    }

    private String interpolate(String template, Map<String, Object> vars) {
        if (template == null) return null;
        String result = template;
        for (Map.Entry<String, Object> entry : vars.entrySet()) {
            String placeholder = "${" + entry.getKey() + "}";
            String value = entry.getValue() == null ? "" : String.valueOf(entry.getValue());
            result = result.replace(placeholder, value);
        }
        return result;
    }
}
