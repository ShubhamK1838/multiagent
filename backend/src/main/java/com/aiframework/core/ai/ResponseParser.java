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
        String trimmed = rawResponse == null ? "" : rawResponse.strip();
        
        // Try extracting what looks like a JSON block
        String json = extractJsonBody(trimmed);
        
        if (json == null) {
            // No { } found, so it must be a plain text final answer.
            return LLMResponse.finalAnswer(trimmed);
        }

        try {
            JsonNode root = objectMapper.readTree(json);
            
            // If it parsed as JSON but isn't an object (e.g. string, array), it's probably not a tool call.
            if (!root.isObject()) {
                 return LLMResponse.finalAnswer(trimmed);
            }

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
                return LLMResponse.finalAnswer(responseText.isEmpty() ? trimmed : responseText);
            }

            if (root.has("tool_call")) {
                return buildToolCallResponse(root, responseText);
            }

            // Fallback if it is a JSON object but lacks tool_call and isn't FINAL_ANSWER
            // It might just be the model returning a JSON example as the final answer.
            if (root.has("type") && "TOOL_CALL".equals(type)) {
                // It explicitly claims to be a tool call but missing tool_call field
                log.warn("Malformed tool call JSON (missing tool_call field): {}", abbreviate(trimmed));
                return LLMResponse.finalAnswer("Sorry — I tried to call a tool but produced an invalid request. Please rephrase or try again.");
            }

            return LLMResponse.finalAnswer(trimmed);

        } catch (JsonProcessingException e) {
            // It looked like JSON (had { and }), but failed to parse.
            // This happens often when the model writes code containing { and } in plain text final answers.
            // Treat the whole original message as the final answer instead of failing.
            log.debug("Found { } but not valid JSON. Treating as plain text final answer. Details: {}", e.getOriginalMessage());
            return LLMResponse.finalAnswer(trimmed);
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

    private String abbreviate(String s) {
        return s.length() <= 200 ? s : s.substring(0, 200) + "…";
    }
}
