package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMResponse;
import com.aiframework.core.tool.ToolDispatcher;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolRegistry;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ToolCallExecutor {

    private final ToolRegistry toolRegistry;
    private final ToolDispatcher toolDispatcher;
    private final ObjectMapper objectMapper;

    public ToolExecutionResult execute(LLMResponse response, String conversationId, List<Message> messages) {
        try {
            ToolDefinitionEntity tool = toolRegistry.findByName(response.getToolName());
            return toolDispatcher.dispatch(tool, response.getToolArguments(), conversationId);
        } catch (IllegalArgumentException e) {
            appendUnknownToolMessage(messages, response.getToolName());
            return null;
        }
    }

    public void appendToolExchange(List<Message> messages, LLMResponse response, ToolExecutionResult result) {
        messages.add(new AssistantMessage(serializeToolCall(response)));
        messages.add(new UserMessage(formatToolResult(response.getToolName(), result)));
    }

    private void appendUnknownToolMessage(List<Message> messages, String requestedName) {
        String available = toolRegistry.getEnabledTools().stream()
                .map(ToolDefinitionEntity::getName)
                .collect(Collectors.joining(", "));
        messages.add(new UserMessage(
                "Tool '" + requestedName + "' not found. Available: " + available));
    }

    private String serializeToolCall(LLMResponse response) {
        String argsJson = "{}";
        try {
            argsJson = objectMapper.writeValueAsString(
                    response.getToolArguments() != null ? response.getToolArguments() : Map.of());
        } catch (JsonProcessingException ignored) {}
        return String.format(
                "{\"type\":\"TOOL_CALL\",\"response\":\"%s\",\"tool_call\":{\"name\":\"%s\",\"arguments\":%s}}",
                escapeJson(response.getReasoning()),
                response.getToolName(),
                argsJson);
    }

    private String formatToolResult(String toolName, ToolExecutionResult result) {
        String body = result.isSuccess() ? result.getResult() : "ERROR: " + result.getError();
        return "[TOOL_RESULT] Tool '" + toolName + "' returned:\n" + body +
               "\n\n[CONTINUE] Analyse this result and continue toward the [CURRENT REQUEST] goal. " +
               "Issue another TOOL_CALL if more steps are needed, or a FINAL_ANSWER when the task is fully complete.";
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
