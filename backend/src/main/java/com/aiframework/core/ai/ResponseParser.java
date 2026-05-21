package com.aiframework.core.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ResponseParser {

    private final ObjectMapper objectMapper;

    public LLMResponse parse(String rawResponse) {
        if (!rawResponse.contains("\"tool_call\"")) {
            return LLMResponse.finalAnswer(rawResponse);
        }
        return tryParseToolCall(rawResponse);
    }

    private LLMResponse tryParseToolCall(String rawResponse) {
        try {
            int jsonStart = rawResponse.indexOf('{');
            int jsonEnd = rawResponse.lastIndexOf('}') + 1;
            if (jsonStart < 0 || jsonEnd <= jsonStart) {
                return LLMResponse.finalAnswer(rawResponse);
            }
            JsonNode root = objectMapper.readTree(rawResponse.substring(jsonStart, jsonEnd));
            if (!root.has("tool_call")) {
                return LLMResponse.finalAnswer(rawResponse);
            }
            JsonNode toolCall = root.get("tool_call");
            String toolName = toolCall.get("name").asText();
            Map<String, Object> args = objectMapper.convertValue(
                    toolCall.get("arguments"),
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
            String reasoning = root.has("reasoning") ? root.get("reasoning").asText() : "";
            return LLMResponse.toolCall(reasoning, toolName, args);
        } catch (JsonProcessingException e) {
            log.debug("Response is not a tool call, treating as final answer");
            return LLMResponse.finalAnswer(rawResponse);
        }
    }
}
