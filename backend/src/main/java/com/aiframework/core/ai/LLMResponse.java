package com.aiframework.core.ai;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class LLMResponse {
    private ResponseType type;
    private String content;
    private String toolName;
    private Map<String, Object> toolArguments;
    private String reasoning;

    public enum ResponseType {
        FINAL_ANSWER, TOOL_CALL
    }

    public static LLMResponse finalAnswer(String content) {
        return LLMResponse.builder().type(ResponseType.FINAL_ANSWER).content(content).build();
    }

    public static LLMResponse toolCall(String reasoning, String toolName, Map<String, Object> args) {
        return LLMResponse.builder()
                .type(ResponseType.TOOL_CALL)
                .reasoning(reasoning)
                .toolName(toolName)
                .toolArguments(args)
                .build();
    }

    public boolean isToolCall() {
        return type == ResponseType.TOOL_CALL;
    }
}
