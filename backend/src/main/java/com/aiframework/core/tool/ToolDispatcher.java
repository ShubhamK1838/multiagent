package com.aiframework.core.tool;

import com.aiframework.core.event.EventBus;
import com.aiframework.core.tool.strategy.ToolExecutionStrategyRegistry;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.aiframework.service.ToolExecutionLogger;
import com.aiframework.service.monitoring.ActiveOperationsTracker;
import com.aiframework.service.monitoring.LogStreamService;
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
    private final ActiveOperationsTracker activeOperationsTracker;
    private final LogStreamService logStreamService;

    public ToolExecutionResult dispatch(ToolDefinitionEntity tool, Map<String, Object> args, String conversationId) {
        log.debug("Dispatching tool: {} (type={})", tool.getName(), tool.getToolType());
        logStreamService.tool(tool.getName(), "▶ TOOL_CALL args=" + (args != null ? args : "{}"));
        eventBus.publishToolCall(conversationId, tool.getName(), args);

        String opId = activeOperationsTracker.startOperation(tool.getName(), args != null ? args.toString() : "{}");

        long start = System.currentTimeMillis();
        ToolExecutionResult result;
        try {
            result = strategyRegistry.get(tool.getToolType()).execute(tool, args, conversationId);
        } catch (Exception e) {
            result = ToolExecutionResult.error("Execution failed: " + e.getMessage());
            logStreamService.error(tool.getName(), "✖ EXCEPTION: " + e.getMessage());
        }
        long duration = System.currentTimeMillis() - start;

        if (result.isSuccess()) {
            logStreamService.tool(tool.getName(), "✔ TOOL_RESULT [" + duration + "ms] " +
                    truncate(result.getResult(), 120));
        } else {
            logStreamService.error(tool.getName(), "✖ TOOL_ERROR [" + duration + "ms] " + result.getError());
        }

        activeOperationsTracker.completeOperation(opId, result.isSuccess(), result.isSuccess() ? "Success" : result.getError());

        // Parse conversationId safely
        java.util.UUID convId = null;
        try { convId = java.util.UUID.fromString(conversationId); } catch (Exception ignored) {}

        executionLogger.record(tool.getName(), tool.getToolType(), tool.getId(), convId, args, result, duration);

        if (result.isSuccess() && !result.isRequiresUserInput()) {
            eventBus.publishToolResult(conversationId, tool.getName(), result.getResult());
        }
        return result;
    }

    private String truncate(String s, int max) {
        if (s == null) return "null";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
