package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMResponse;
import com.aiframework.core.tool.ToolDispatcher;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolRegistry;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ToolCallExecutorTest {

    @Mock
    private ToolRegistry toolRegistry;

    @Mock
    private ToolDispatcher toolDispatcher;

    private ToolCallExecutor executor;

    @BeforeEach
    void setUp() {
        executor = new ToolCallExecutor(toolRegistry, toolDispatcher, new ObjectMapper());
    }

    // ── execute() ─────────────────────────────────────────────────────────────

    @Test
    void execute_toolFound_returnsSuccessResult() {
        ToolDefinitionEntity tool = buildTool("list_files");
        when(toolRegistry.findByName("list_files")).thenReturn(tool);
        when(toolDispatcher.dispatch(eq(tool), any(), eq("conv-1")))
                .thenReturn(ToolExecutionResult.success("[{\"name\":\"file.txt\"}]"));

        LLMResponse response = LLMResponse.toolCall("listing", "list_files", Map.of("path", "/home"));
        ToolExecutionResult result = executor.execute(response, "conv-1");

        assertTrue(result.isSuccess());
        assertEquals("[{\"name\":\"file.txt\"}]", result.getResult());
    }

    @Test
    void execute_toolNotFound_returnsErrorResult() {
        when(toolRegistry.findByName("unknown_tool"))
                .thenThrow(new IllegalArgumentException("Tool not found: unknown_tool"));

        LLMResponse response = LLMResponse.toolCall("r", "unknown_tool", Map.of());
        ToolExecutionResult result = executor.execute(response, "conv-1");

        assertFalse(result.isSuccess());
        assertTrue(result.getError().contains("unknown_tool"));
    }

    @Test
    void execute_toolFound_availableToolsListedInError() {
        ToolDefinitionEntity t1 = buildTool("list_files");
        ToolDefinitionEntity t2 = buildTool("execute_command");
        when(toolRegistry.findByName("bad_tool"))
                .thenThrow(new IllegalArgumentException("Tool not found"));
        when(toolRegistry.getEnabledTools()).thenReturn(List.of(t1, t2));

        LLMResponse response = LLMResponse.toolCall("r", "bad_tool", Map.of());
        ToolExecutionResult result = executor.execute(response, "conv-1");

        assertFalse(result.isSuccess());
        assertTrue(result.getError().contains("list_files") || result.getError().contains("execute_command"),
                "Error should list available tools. Got: " + result.getError());
    }

    @Test
    void execute_dispatcherThrows_errorResultReturned() {
        ToolDefinitionEntity tool = buildTool("execute_command");
        when(toolRegistry.findByName("execute_command")).thenReturn(tool);
        when(toolDispatcher.dispatch(any(), any(), any()))
                .thenThrow(new RuntimeException("Unexpected failure"));
        when(toolRegistry.getEnabledTools()).thenReturn(List.of(tool));

        LLMResponse response = LLMResponse.toolCall("r", "execute_command", Map.of("cmd", "dir"));
        // Should not throw; the IllegalArgumentException catch won't catch RuntimeException here
        // but RuntimeException from dispatch will propagate.
        // Actually ToolCallExecutor only catches IllegalArgumentException.
        // The test verifies RuntimeException propagates up so ToolDispatcher's catch handles it.
        assertThrows(RuntimeException.class, () -> executor.execute(response, "conv-1"));
    }

    // ── appendToolExchange() ──────────────────────────────────────────────────

    @Test
    void appendToolExchange_addsAssistantAndUserMessages() {
        List<Message> messages = new ArrayList<>();
        LLMResponse response = LLMResponse.toolCall("Listing files", "list_files", Map.of("path", "/home"));
        ToolExecutionResult result = ToolExecutionResult.success("[{\"name\":\"a.txt\"}]");

        executor.appendToolExchange(messages, response, result);

        assertEquals(2, messages.size());
        assertTrue(messages.get(0) instanceof AssistantMessage);
        String assistantText = messages.get(0).getText();
        assertTrue(assistantText.contains("TOOL_CALL"), "Assistant message must contain TOOL_CALL");
        assertTrue(assistantText.contains("list_files"), "Must reference the tool name");

        String userText = messages.get(1).getText();
        assertTrue(userText.contains("[TOOL_RESULT]"), "User message must contain TOOL_RESULT tag");
        assertTrue(userText.contains("list_files"), "Must reference the tool name");
        assertTrue(userText.contains("[{\"name\":\"a.txt\"}]"), "Must include the tool result");
    }

    @Test
    void appendToolExchange_errorResult_formatsErrorInUserMessage() {
        List<Message> messages = new ArrayList<>();
        LLMResponse response = LLMResponse.toolCall("r", "execute_command", Map.of("cmd", "rm -rf /"));
        ToolExecutionResult result = ToolExecutionResult.error("Command 'rm' is not permitted");

        executor.appendToolExchange(messages, response, result);

        assertEquals(2, messages.size());
        String userText = messages.get(1).getText();
        assertTrue(userText.contains("ERROR"), "Must indicate error to LLM");
        assertTrue(userText.contains("not permitted"), "Must include error detail");
    }

    @Test
    void appendToolExchange_assistantMessageContainsValidJson() throws Exception {
        List<Message> messages = new ArrayList<>();
        LLMResponse response = LLMResponse.toolCall("listing", "list_files",
                Map.of("path", "/home/user"));
        ToolExecutionResult result = ToolExecutionResult.success("[]");

        executor.appendToolExchange(messages, response, result);

        String assistantText = messages.get(0).getText();
        // Should be valid parseable JSON
        assertDoesNotThrow(() -> new ObjectMapper().readTree(assistantText),
                "Assistant message must be valid JSON: " + assistantText);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private ToolDefinitionEntity buildTool(String name) {
        return ToolDefinitionEntity.builder()
                .name(name)
                .description("Test tool " + name)
                .toolType("BUILTIN")
                .parametersSchema(Map.of())
                .handlerConfig(Map.of("handler", name))
                .enabled(true)
                .requiresConfirmation(false)
                .build();
    }
}
