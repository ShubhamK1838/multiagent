package com.aiframework.core.tool.strategy;

import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomToolStrategy implements ToolExecutionStrategy {

    private final EventBus eventBus;
    private final ObjectMapper objectMapper;

    @Override
    public String toolType() {
        return "CUSTOM";
    }

    @Override
    public ToolExecutionResult execute(ToolDefinitionEntity tool, Map<String, Object> arguments, String conversationId) {
        String eventName = (String) tool.getHandlerConfig().getOrDefault("frontend_event", tool.getName());
        
        try {
            String payload = objectMapper.writeValueAsString(arguments);
            
            AgentEvent event = AgentEvent.of(EventType.TOOL_RESULT, conversationId, payload);
            event.setMetadata(Map.of("frontend_event", eventName));
            eventBus.publish(event);
            
            return ToolExecutionResult.success("Frontend event dispatched. The user should see the shape now.");
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize arguments for custom tool: {}", tool.getName(), e);
            return ToolExecutionResult.error("Failed to serialize arguments: " + e.getMessage());
        }
    }
}
