package com.aiframework.core.tool;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ToolExecutionResult {
    private boolean success;
    private String result;
    private String error;
    private boolean requiresUserInput;
    private String formRequestId;

    public static ToolExecutionResult success(String result) {
        return ToolExecutionResult.builder().success(true).result(result).build();
    }

    public static ToolExecutionResult error(String error) {
        return ToolExecutionResult.builder().success(false).error(error).build();
    }

    public static ToolExecutionResult formRequest(String formRequestId) {
        return ToolExecutionResult.builder()
                .success(true)
                .requiresUserInput(true)
                .formRequestId(formRequestId)
                .build();
    }
}
