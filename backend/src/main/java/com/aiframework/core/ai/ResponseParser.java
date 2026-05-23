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
        String json = extractJsonBody(trimmed);
        if (json == null) json = trimmed;

        try {
            JsonNode root = objectMapper.readTree(json);
            String type = root.path("type").asText("").toUpperCase();
            
            JsonNode responseNode = root.path("response");
            String responseText = "";
            
            if (responseNode.isTextual()) {
                responseText = responseNode.asText("");
            } else if (responseNode.isObject()) {
                StringBuilder sb = new StringBuilder();
                responseNode.fields().forEachRemaining(entry -> {
                    sb.append(entry.getValue().asText("")).append("\n\n");
                });
                responseText = sb.toString().trim();
            } else if (!responseNode.isMissingNode() && !responseNode.isNull()) {
                responseText = responseNode.toString();
            }

            if ("FINAL_ANSWER".equals(type) || "FINAL ANSWER".equals(type)) {
                return LLMResponse.finalAnswer(responseText.isEmpty() ? json : responseText);
            }

            if (root.has("tool_call")) {
                return buildToolCallResponse(root, responseText);
            }

            // Fallback if no tool_call but not FINAL_ANSWER
            return LLMResponse.finalAnswer(responseText.isEmpty() ? json : responseText);

        } catch (JsonProcessingException e) {
            log.debug("Tool-call JSON failed to parse: {}", e.getOriginalMessage());
            return safeFallback(trimmed);
        }
    }

    private LLMResponse buildToolCallResponse(JsonNode root, String responseText) {
        JsonNode toolCall = root.get("tool_call");
        String toolName = toolCall.path("name").asText();
        JsonNode argsNode = toolCall.get("arguments");
        Map<String, Object> args = (argsNode != null && !argsNode.isNull())
                ? objectMapper.convertValue(argsNode,
                        objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class))
                : Map.of();
        return LLMResponse.toolCall(responseText, toolName, args);
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
