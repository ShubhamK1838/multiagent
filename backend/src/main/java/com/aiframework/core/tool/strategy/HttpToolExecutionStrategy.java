package com.aiframework.core.tool.strategy;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.handlers.HttpToolHandler;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class HttpToolExecutionStrategy implements ToolExecutionStrategy {
    private final HttpToolHandler httpToolHandler;

    @Override
    public String toolType() { return "HTTP"; }

    @Override
    public ToolExecutionResult execute(ToolDefinitionEntity tool, Map<String, Object> args, String conversationId) {
        return httpToolHandler.execute(tool, args);
    }
}
