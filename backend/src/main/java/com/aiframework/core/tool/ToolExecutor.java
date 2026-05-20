package com.aiframework.core.tool;

import com.aiframework.core.event.AgentEventPublisher;
import com.aiframework.core.rag.RAGService;
import com.aiframework.domain.entity.FormRequest;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.aiframework.domain.repository.FormRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ToolExecutor {

    private final RAGService ragService;
    private final FormRequestRepository formRequestRepository;
    private final AgentEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final WebClient.Builder webClientBuilder;

    public ToolExecutionResult execute(ToolDefinitionEntity tool, Map<String, Object> args, String conversationId) {
        log.debug("Executing tool: {} with args: {}", tool.getName(), args);
        eventPublisher.publishToolCall(conversationId, tool.getName(), args);

        try {
            ToolExecutionResult result = switch (tool.getToolType()) {
                case "BUILTIN" -> executeBuiltin(tool, args, conversationId);
                case "HTTP" -> executeHttp(tool, args);
                default -> ToolExecutionResult.error("Unknown tool type: " + tool.getToolType());
            };

            if (result.isSuccess() && !result.isRequiresUserInput()) {
                eventPublisher.publishToolResult(conversationId, tool.getName(), result.getResult());
            }
            return result;
        } catch (Exception e) {
            log.error("Tool execution failed: {}", tool.getName(), e);
            return ToolExecutionResult.error("Tool execution failed: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private ToolExecutionResult executeBuiltin(ToolDefinitionEntity tool, Map<String, Object> args, String conversationId) {
        Map<String, Object> config = tool.getHandlerConfig();
        String handler = (String) config.get("handler");

        return switch (handler) {
            case "calculator" -> {
                String expr = (String) args.get("expression");
                yield evaluateMath(expr);
            }
            case "rag_search" -> {
                String query = (String) args.get("query");
                String results = ragService.search(query);
                yield ToolExecutionResult.success(results);
            }
            case "ask_user" -> {
                Map<String, Object> schema = (Map<String, Object>) args.get("form_schema");
                String reason = (String) args.getOrDefault("reason", "Additional input needed");
                yield createFormRequest(conversationId, schema, reason);
            }
            default -> ToolExecutionResult.error("Unknown builtin handler: " + handler);
        };
    }

    private ToolExecutionResult executeHttp(ToolDefinitionEntity tool, Map<String, Object> args) {
        Map<String, Object> config = tool.getHandlerConfig();
        String url = interpolate((String) config.get("url"), args);
        String method = (String) config.getOrDefault("method", "GET");

        WebClient client = webClientBuilder.build();
        try {
            String response = client.method(org.springframework.http.HttpMethod.valueOf(method))
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            return ToolExecutionResult.success(response);
        } catch (Exception e) {
            return ToolExecutionResult.error("HTTP call failed: " + e.getMessage());
        }
    }

    private ToolExecutionResult evaluateMath(String expression) {
        try {
            ScriptEngineManager manager = new ScriptEngineManager();
            ScriptEngine engine = manager.getEngineByName("JavaScript");
            if (engine == null) {
                // Fallback: simple arithmetic only
                return ToolExecutionResult.error("Script engine not available");
            }
            Object result = engine.eval(expression.replaceAll("[^0-9+\\-*/().,% ]", ""));
            return ToolExecutionResult.success(String.valueOf(result));
        } catch (Exception e) {
            return ToolExecutionResult.error("Math evaluation failed: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private ToolExecutionResult createFormRequest(String conversationId, Map<String, Object> schema, String reason) {
        FormRequest formRequest = FormRequest.builder()
                .id(UUID.randomUUID())
                .conversationId(UUID.fromString(conversationId))
                .schema(schema)
                .status("PENDING")
                .build();
        formRequest = formRequestRepository.save(formRequest);

        eventPublisher.publishFormRequest(conversationId, formRequest.getId().toString(), schema);
        return ToolExecutionResult.formRequest(formRequest.getId().toString());
    }

    private String interpolate(String template, Map<String, Object> vars) {
        String result = template;
        for (Map.Entry<String, Object> entry : vars.entrySet()) {
            result = result.replace("${" + entry.getKey() + "}", String.valueOf(entry.getValue()));
        }
        return result;
    }
}
