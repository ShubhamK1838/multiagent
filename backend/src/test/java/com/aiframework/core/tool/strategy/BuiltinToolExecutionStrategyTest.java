package com.aiframework.core.tool.strategy;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.aiframework.core.tool.ToolHandlerRegistry;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class BuiltinToolExecutionStrategyTest {

    private BuiltinToolExecutionStrategy strategy;
    private ToolHandler stubbedHandler;

    @BeforeEach
    void setUp() {
        stubbedHandler = new ToolHandler() {
            public String handlerName() { return "stub_tool"; }
            public ToolExecutionResult execute(Map<String, Object> args, String convId) {
                return ToolExecutionResult.success("stub result");
            }
        };
        ToolHandlerRegistry registry = new ToolHandlerRegistry(List.of(stubbedHandler));
        strategy = new BuiltinToolExecutionStrategy(registry);
    }

    @Test
    void toolType_isBuiltin() {
        assertEquals("BUILTIN", strategy.toolType());
    }

    @Test
    void validHandlerConfig_executesSuccessfully() {
        ToolDefinitionEntity tool = buildTool("stub_tool", Map.of("handler", "stub_tool"));
        ToolExecutionResult result = strategy.execute(tool, Map.of(), "conv-1");
        assertTrue(result.isSuccess());
        assertEquals("stub result", result.getResult());
    }

    @Test
    void nullHandlerConfig_returnsError() {
        ToolDefinitionEntity tool = buildTool("no_config_tool", null);
        ToolExecutionResult result = strategy.execute(tool, Map.of(), "conv-1");
        assertFalse(result.isSuccess());
        assertTrue(result.getError().contains("no handler configured"));
    }

    @Test
    void missingHandlerKey_returnsError() {
        ToolDefinitionEntity tool = buildTool("broken_tool", Map.of("other_key", "value"));
        ToolExecutionResult result = strategy.execute(tool, Map.of(), "conv-1");
        assertFalse(result.isSuccess());
        assertTrue(result.getError().contains("no handler configured"),
                "Expected 'no handler configured', got: " + result.getError());
    }

    @Test
    void emptyHandlerName_returnsError() {
        Map<String, Object> config = new HashMap<>();
        config.put("handler", "");
        ToolDefinitionEntity tool = buildTool("empty_handler", config);
        ToolExecutionResult result = strategy.execute(tool, Map.of(), "conv-1");
        assertFalse(result.isSuccess());
        assertTrue(result.getError().contains("empty handler name"));
    }

    @Test
    void unknownHandlerName_throwsException() {
        ToolDefinitionEntity tool = buildTool("bad_tool", Map.of("handler", "non_existent"));
        // ToolHandlerRegistry.get() throws IllegalArgumentException for unknown handlers
        assertThrows(IllegalArgumentException.class,
                () -> strategy.execute(tool, Map.of(), "conv-1"));
    }

    private ToolDefinitionEntity buildTool(String name, Map<String, Object> handlerConfig) {
        return ToolDefinitionEntity.builder()
                .name(name)
                .description("Test")
                .toolType("BUILTIN")
                .parametersSchema(Map.of())
                .handlerConfig(handlerConfig)
                .enabled(true)
                .requiresConfirmation(false)
                .build();
    }
}
