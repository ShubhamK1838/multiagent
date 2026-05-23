package com.aiframework.core.tool.strategy;

import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomToolStrategyTest {

    @Mock
    private EventBus eventBus;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private CustomToolStrategy customToolStrategy;

    private ToolDefinitionEntity toolDefinition;

    @BeforeEach
    void setUp() {
        toolDefinition = new ToolDefinitionEntity();
        toolDefinition.setId(UUID.randomUUID());
        toolDefinition.setName("draw_ui_shape");
    }

    @Test
    void toolType_ShouldReturnCustom() {
        assertEquals("custom", customToolStrategy.toolType());
    }

    @Test
    void execute_ShouldPublishEventAndReturnSuccess() throws Exception {
        // Arrange
        String conversationId = UUID.randomUUID().toString();
        toolDefinition.setHandlerConfig(Map.of("frontend_event", "draw_shape_action"));
        
        Map<String, Object> arguments = Map.of(
                "shape", "circle",
                "x", 100,
                "y", 200,
                "size", 50,
                "color", "#ff0000"
        );
        
        String jsonPayload = "{\"shape\":\"circle\",\"x\":100,\"y\":200,\"size\":50,\"color\":\"#ff0000\"}";
        when(objectMapper.writeValueAsString(arguments)).thenReturn(jsonPayload);

        // Act
        ToolExecutionResult result = customToolStrategy.execute(toolDefinition, arguments, conversationId);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Frontend event dispatched. The user should see the shape now.", result.getResult());

        ArgumentCaptor<AgentEvent> eventCaptor = ArgumentCaptor.forClass(AgentEvent.class);
        verify(eventBus).publish(eventCaptor.capture());

        AgentEvent publishedEvent = eventCaptor.getValue();
        assertEquals(EventType.TOOL_RESULT, publishedEvent.getType());
        assertEquals(conversationId, publishedEvent.getConversationId());
        assertEquals(jsonPayload, publishedEvent.getContent());
        assertNotNull(publishedEvent.getMetadata());
        assertEquals("draw_shape_action", publishedEvent.getMetadata().get("frontend_event"));
    }
    
    @Test
    void execute_ShouldFallbackToToolNameIfEventNameMissing() throws Exception {
        // Arrange
        String conversationId = UUID.randomUUID().toString();
        toolDefinition.setHandlerConfig(Map.of()); // Empty config
        Map<String, Object> arguments = Map.of("test", "data");
        
        when(objectMapper.writeValueAsString(arguments)).thenReturn("{}");

        // Act
        customToolStrategy.execute(toolDefinition, arguments, conversationId);

        // Assert
        ArgumentCaptor<AgentEvent> eventCaptor = ArgumentCaptor.forClass(AgentEvent.class);
        verify(eventBus).publish(eventCaptor.capture());

        AgentEvent publishedEvent = eventCaptor.getValue();
        assertEquals("draw_ui_shape", publishedEvent.getMetadata().get("frontend_event"));
    }
}
