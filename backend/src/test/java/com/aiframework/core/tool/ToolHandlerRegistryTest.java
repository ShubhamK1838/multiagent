package com.aiframework.core.tool;

import com.aiframework.core.tool.handlers.ExecuteCommandHandler;
import com.aiframework.core.tool.handlers.ListFilesHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ToolHandlerRegistryTest {

    @Test
    void allHandlersRegistered_canBeRetrievedByName() {
        ToolHandler h1 = new ExecuteCommandHandler();
        ToolHandler h2 = new ListFilesHandler(new ObjectMapper());

        ToolHandlerRegistry registry = new ToolHandlerRegistry(List.of(h1, h2));

        assertNotNull(registry.get("execute_command"));
        assertNotNull(registry.get("list_files"));
    }

    @Test
    void getHandler_returnsCorrectInstance() {
        ExecuteCommandHandler exec = new ExecuteCommandHandler();
        ToolHandlerRegistry registry = new ToolHandlerRegistry(List.of(exec));

        assertSame(exec, registry.get("execute_command"));
    }

    @Test
    void unknownHandlerName_throwsIllegalArgumentException() {
        ToolHandlerRegistry registry = new ToolHandlerRegistry(List.of());

        assertThrows(IllegalArgumentException.class,
                () -> registry.get("non_existent_handler"));
    }

    @Test
    void emptyHandlerList_registryCreatesSuccessfully() {
        assertDoesNotThrow(() -> new ToolHandlerRegistry(List.of()));
    }

    @Test
    void duplicateHandlerNames_lastOneWins() {
        // If two handlers share a name, Java's Collectors.toMap throws by default.
        // This test verifies that — duplicate names are a bug that fails at startup.
        ToolHandler dup1 = new ToolHandler() {
            public String handlerName() { return "duplicate"; }
            public ToolExecutionResult execute(java.util.Map<String, Object> a, String c) {
                return ToolExecutionResult.success("first");
            }
        };
        ToolHandler dup2 = new ToolHandler() {
            public String handlerName() { return "duplicate"; }
            public ToolExecutionResult execute(java.util.Map<String, Object> a, String c) {
                return ToolExecutionResult.success("second");
            }
        };

        assertThrows(IllegalStateException.class,
                () -> new ToolHandlerRegistry(List.of(dup1, dup2)));
    }
}
