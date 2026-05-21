package com.aiframework.core.tool;

import com.aiframework.core.event.EventBus;
import com.aiframework.core.tool.strategy.ToolExecutionStrategyRegistry;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.aiframework.service.ToolExecutionLogger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ToolDispatcher {
    private final ToolExecutionStrategyRegistry strategyRegistry;
    private final EventBus eventBus;
    private final ToolExecutionLogger executionLogger;

    public ToolExecutionResult dispatch(ToolDefinitionEntity tool, Map<String, Object> args, String conversationId) {
        log.debug("Dispatching tool: {} (type={})", tool.getName(), tool.getToolType());
        eventBus.publishToolCall(conversationId, tool.getName(), args);

        long start = System.currentTimeMillis();
        ToolExecutionResult result;
        try {
            result = strategyRegistry.get(tool.getToolType()).execute(tool, args, conversationId);
        } catch (Exception e) {
            result = ToolExecutionResult.error("Execution failed: " + e.getMessage());
        }
        long duration = System.currentTimeMillis() - start;

        // Parse conversationId safely
        java.util.UUID convId = null;
        try { convId = java.util.UUID.fromString(conversationId); } catch (Exception ignored) {}

        executionLogger.record(tool.getName(), tool.getToolType(), tool.getId(), convId, args, result, duration);

        if (result.isSuccess() && !result.isRequiresUserInput()) {
            eventBus.publishToolResult(conversationId, tool.getName(), result.getResult());
        }
        return result;
    }
}
