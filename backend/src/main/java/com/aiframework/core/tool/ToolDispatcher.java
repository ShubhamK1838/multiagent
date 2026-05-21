package com.aiframework.core.tool;

import com.aiframework.core.event.EventBus;
import com.aiframework.core.tool.handlers.HttpToolHandler;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ToolDispatcher {

    private final ToolHandlerRegistry builtinRegistry;
    private final HttpToolHandler httpToolHandler;
    private final EventBus eventBus;

    public ToolExecutionResult dispatch(ToolDefinitionEntity tool, Map<String, Object> args, String conversationId) {
        log.debug("Dispatching tool: {} (type={})", tool.getName(), tool.getToolType());
        eventBus.publishToolCall(conversationId, tool.getName(), args);

        ToolExecutionResult result = switch (tool.getToolType()) {
            case "BUILTIN" -> {
                String handler = (String) tool.getHandlerConfig().get("handler");
                yield builtinRegistry.get(handler).execute(args, conversationId);
            }
            case "HTTP" -> httpToolHandler.execute(tool, args);
            default -> ToolExecutionResult.error("Unknown tool type: " + tool.getToolType());
        };

        if (result.isSuccess() && !result.isRequiresUserInput()) {
            eventBus.publishToolResult(conversationId, tool.getName(), result.getResult());
        }
        return result;
    }
}
