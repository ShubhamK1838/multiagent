package com.aiframework.core.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class ResponseParserTest {

    private ResponseParser parser;

    @BeforeEach
    void setUp() {
        parser = new ResponseParser(new ObjectMapper());
    }

    // ── FINAL_ANSWER paths ────────────────────────────────────────────────────

    @Test
    void plainText_returnsFinalAnswer() {
        LLMResponse r = parser.parse("Hello! How can I help you today?");
        assertFinalAnswer(r, "Hello! How can I help you today?");
    }

    @Test
    void nullInput_returnsEmptyFinalAnswer() {
        LLMResponse r = parser.parse(null);
        assertTrue(r.getType() == LLMResponse.ResponseType.FINAL_ANSWER);
    }

    @Test
    void emptyInput_returnsEmptyFinalAnswer() {
        LLMResponse r = parser.parse("   ");
        assertTrue(r.getType() == LLMResponse.ResponseType.FINAL_ANSWER);
    }

    @Test
    void jsonTypeFinalAnswer_extractsResponseText() {
        String json = """
                {"type":"FINAL_ANSWER","response":"Here is your answer."}
                """;
        LLMResponse r = parser.parse(json);
        assertFinalAnswer(r, "Here is your answer.");
    }

    @Test
    void jsonTypeFinalAnswerWithSpace_extractsResponseText() {
        String json = """
                {"type":"FINAL ANSWER","response":"Here is your answer."}
                """;
        LLMResponse r = parser.parse(json);
        assertFinalAnswer(r, "Here is your answer.");
    }

    @Test
    void plainTextContainingBraces_returnsFinalAnswer() {
        // Code example in plain text must not be confused for a tool call
        String text = "Use `Map<String, Object>` like this: {\"key\": \"value\"}";
        LLMResponse r = parser.parse(text);
        assertFinalAnswer(r, text);
    }

    // ── TOOL_CALL — correct format ────────────────────────────────────────────

    @Test
    void correctToolCallJson_returnsToolCall() {
        String json = """
                {
                  "type": "TOOL_CALL",
                  "response": "I will list the files.",
                  "tool_call": {
                    "name": "list_files",
                    "arguments": {"path": "/home/user"}
                  }
                }
                """;
        LLMResponse r = parser.parse(json);
        assertToolCall(r, "list_files");
        assertEquals("/home/user", r.getToolArguments().get("path"));
        assertEquals("I will list the files.", r.getReasoning());
    }

    @Test
    void toolCallWithEmptyArguments_returnsToolCall() {
        String json = """
                {
                  "type": "TOOL_CALL",
                  "response": "Getting system info.",
                  "tool_call": {"name": "get_system_info", "arguments": {}}
                }
                """;
        LLMResponse r = parser.parse(json);
        assertToolCall(r, "get_system_info");
        assertTrue(r.getToolArguments().isEmpty());
    }

    @Test
    void toolCallWithNoResponseField_returnsToolCall() {
        String json = """
                {"type":"TOOL_CALL","tool_call":{"name":"execute_command","arguments":{"cmd":"dir"}}}
                """;
        LLMResponse r = parser.parse(json);
        assertToolCall(r, "execute_command");
        assertEquals("dir", r.getToolArguments().get("cmd"));
    }

    @Test
    void codeFencedToolCallJson_returnsToolCall() {
        String json = """
                ```json
                {
                  "type": "TOOL_CALL",
                  "response": "Listing files.",
                  "tool_call": {"name": "list_files", "arguments": {"path": "C:/Users"}}
                }
                ```
                """;
        LLMResponse r = parser.parse(json);
        assertToolCall(r, "list_files");
    }

    @Test
    void codeFencedWithoutLanguage_returnsToolCall() {
        String json = """
                ```
                {"type":"TOOL_CALL","response":"r","tool_call":{"name":"get_system_info","arguments":{}}}
                ```
                """;
        LLMResponse r = parser.parse(json);
        assertToolCall(r, "get_system_info");
    }

    // ── TOOL_CALL — malformed / recovery paths ────────────────────────────────

    @Test
    void typeLowercaseToolName_recoversToolCall() {
        // LLM used lowercase tool name as type (most common malformed format)
        String json = """
                {"type":"list_files","response":"I will list the files."}
                """;
        LLMResponse r = parser.parse(json);
        assertToolCall(r, "list_files");
    }

    @Test
    void typeUppercaseToolName_recoversToolCall() {
        String json = """
                {"type":"LIST_FILES","response":"I will list the files."}
                """;
        LLMResponse r = parser.parse(json);
        assertToolCall(r, "list_files");
    }

    @Test
    void typeLowercaseToolName_withLooseArgs_recoversWithArgs() {
        String json = """
                {"type":"execute_command","response":"Running dir.","cmd":"dir"}
                """;
        LLMResponse r = parser.parse(json);
        assertToolCall(r, "execute_command");
        assertEquals("dir", r.getToolArguments().get("cmd"));
    }

    @Test
    void typeLowercaseMultiWord_recoversToolCall() {
        String json = """
                {"type":"get_system_info","response":"Getting info."}
                """;
        LLMResponse r = parser.parse(json);
        assertToolCall(r, "get_system_info");
    }

    @Test
    void typeToolCallMissingToolCallField_returnsFriendlyError() {
        String json = """
                {"type":"TOOL_CALL","response":"Calling list_files"}
                """;
        LLMResponse r = parser.parse(json);
        assertTrue(r.getType() == LLMResponse.ResponseType.FINAL_ANSWER);
        assertNotNull(r.getContent());
        assertFalse(r.getContent().startsWith("{"), "Must not leak raw JSON to user");
    }

    @Test
    void completelyUnrecognisedJsonShape_returnsErrorNotRawJson() {
        String json = """
                {"someRandomField":"value","another":123}
                """;
        LLMResponse r = parser.parse(json);
        assertTrue(r.getType() == LLMResponse.ResponseType.FINAL_ANSWER);
        assertNotNull(r.getContent());
        assertFalse(r.getContent().startsWith("{"), "Must not leak raw JSON to user");
    }

    @Test
    void invalidJson_returnedAsPlainText() {
        String broken = "{ invalid json here";
        LLMResponse r = parser.parse(broken);
        assertFinalAnswer(r, "{ invalid json here");
    }

    @Test
    void jsonArray_returnedAsFinalAnswer() {
        String json = "[\"item1\",\"item2\"]";
        LLMResponse r = parser.parse(json);
        assertTrue(r.getType() == LLMResponse.ResponseType.FINAL_ANSWER);
    }

    // ── Multi-line / whitespace edge cases ────────────────────────────────────

    @Test
    void leadingWhitespaceBeforeJson_parsesCorrectly() {
        String json = "\n\n  {\"type\":\"TOOL_CALL\",\"response\":\"r\"," +
                "\"tool_call\":{\"name\":\"list_files\",\"arguments\":{}}}";
        LLMResponse r = parser.parse(json);
        assertToolCall(r, "list_files");
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{\"type\":\"TOOL_CALL\",\"response\":\"r\",\"tool_call\":{\"name\":\"list_files\",\"arguments\":{}}}",
        "{\"type\":\"TOOL_CALL\",\"response\":\"r\",\"tool_call\":{\"name\":\"execute_command\",\"arguments\":{\"cmd\":\"dir\"}}}",
        "{\"type\":\"TOOL_CALL\",\"response\":\"r\",\"tool_call\":{\"name\":\"get_system_info\",\"arguments\":{}}}",
    })
    void validToolCallVariants_allParsedCorrectly(String json) {
        LLMResponse r = parser.parse(json);
        assertTrue(r.isToolCall(), "Expected tool call for: " + json);
        assertNotNull(r.getToolName());
    }

    // ── Helper assertions ─────────────────────────────────────────────────────

    private void assertFinalAnswer(LLMResponse r, String expectedContent) {
        assertEquals(LLMResponse.ResponseType.FINAL_ANSWER, r.getType());
        assertEquals(expectedContent, r.getContent());
    }

    private void assertToolCall(LLMResponse r, String expectedTool) {
        assertTrue(r.isToolCall(), "Expected TOOL_CALL but got: " + r.getType() +
                " content=" + r.getContent());
        assertEquals(expectedTool, r.getToolName());
        assertNotNull(r.getToolArguments());
    }
}
