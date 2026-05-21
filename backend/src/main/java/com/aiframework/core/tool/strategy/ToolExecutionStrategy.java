package com.aiframework.core.tool.strategy;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import java.util.Map;

public interface ToolExecutionStrategy {
    String toolType();
    ToolExecutionResult execute(ToolDefinitionEntity tool, Map<String, Object> args, String conversationId);
}
