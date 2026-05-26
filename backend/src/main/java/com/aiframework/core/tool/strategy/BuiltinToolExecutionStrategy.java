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
        Map<String, Object> config = tool.getHandlerConfig();
        if (config == null || !config.containsKey("handler")) {
            return ToolExecutionResult.error("Tool '" + tool.getName() + "' has no handler configured");
        }
        String handler = (String) config.get("handler");
        if (handler == null || handler.isBlank()) {
            return ToolExecutionResult.error("Tool '" + tool.getName() + "' has an empty handler name");
        }
        return registry.get(handler).execute(args, conversationId);
    }
}
