package com.aiframework.core.tool.strategy;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandlerRegistry;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class BuiltinToolExecutionStrategy implements ToolExecutionStrategy {
    private final ToolHandlerRegistry registry;

    @Override
    public String toolType() { return "BUILTIN"; }

    @Override
    public ToolExecutionResult execute(ToolDefinitionEntity tool, Map<String, Object> args, String conversationId) {
        String handler = (String) tool.getHandlerConfig().get("handler");
        return registry.get(handler).execute(args, conversationId);
    }
}
