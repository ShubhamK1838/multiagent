package com.aiframework.core.tool;

import java.util.Map;

public interface ToolHandler {
    String handlerName();
    ToolExecutionResult execute(Map<String, Object> args, String conversationId);
}
