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

    private static final String MALFORMED_TOOL_CALL_FALLBACK =
            "Sorry — I tried to call a tool but produced an invalid request. " +
            "Please rephrase or try again.";

    private final ObjectMapper objectMapper;

    public LLMResponse parse(String rawResponse) {
        String trimmed = rawResponse == null ? "" : rawResponse.strip();
        if (looksLikeToolCallEnvelope(trimmed)) {
            return parseToolCallOrFallback(trimmed);
        }
        return LLMResponse.finalAnswer(rawResponse);
    }

    private boolean looksLikeToolCallEnvelope(String trimmed) {
        return trimmed.contains("\"tool_call\"")
                || trimmed.startsWith("{")
                || trimmed.startsWith("```");
    }

    private LLMResponse parseToolCallOrFallback(String trimmed) {
        String json = extractJsonBody(trimmed);
        if (json == null) {
            return safeFallback(trimmed);
        }
        try {
            JsonNode root = objectMapper.readTree(json);
            if (!root.has("tool_call")) {
                return LLMResponse.finalAnswer(trimmed);
            }
            return buildToolCallResponse(root);
        } catch (JsonProcessingException e) {
            log.debug("Tool-call JSON failed to parse: {}", e.getOriginalMessage());
            return safeFallback(trimmed);
        }
    }

    private LLMResponse buildToolCallResponse(JsonNode root) {
        JsonNode toolCall = root.get("tool_call");
        String toolName = toolCall.path("name").asText();
        String reasoning = root.path("reasoning").asText("");
        Map<String, Object> args = objectMapper.convertValue(
                toolCall.get("arguments"),
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
        return LLMResponse.toolCall(reasoning, toolName, args);
    }

    private String extractJsonBody(String trimmed) {
        String stripped = stripCodeFences(trimmed);
        int start = stripped.indexOf('{');
        int end = stripped.lastIndexOf('}');
        if (start < 0 || end <= start) return null;
        return stripped.substring(start, end + 1);
    }

    private String stripCodeFences(String s) {
        if (!s.startsWith("```")) return s;
        int firstNewline = s.indexOf('\n');
        int lastFence = s.lastIndexOf("```");
        if (firstNewline < 0 || lastFence <= firstNewline) return s;
        return s.substring(firstNewline + 1, lastFence);
    }

    private LLMResponse safeFallback(String original) {
        log.warn("Discarding malformed tool-call JSON from model: {}", abbreviate(original));
        return LLMResponse.finalAnswer(MALFORMED_TOOL_CALL_FALLBACK);
    }

    private String abbreviate(String s) {
        return s.length() <= 200 ? s : s.substring(0, 200) + "…";
    }
}
