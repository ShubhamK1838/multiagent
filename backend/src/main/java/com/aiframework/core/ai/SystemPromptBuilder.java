package com.aiframework.core.ai;

import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Builds the system message that primes every agent turn.
 *
 * The instructions enforce exactly one of three response modes:
 *   1. FINAL_ANSWER  — plain prose, no JSON, no code fences
 *   2. TOOL_CALL     — single JSON object with reasoning + tool_call
 *   3. ASK_USER      — JSON tool call using the "ask_user" tool to request a form
 *
 * The wording is deliberately strict: the parser and streaming filter rely on
 * the model NOT mixing prose and JSON in the same response.
 */
@Component
public class SystemPromptBuilder {

    private static final String HISTORY_RULES =
            "## Conversation History vs. Current Request — CRITICAL\n" +
            "\n" +
            "The messages you receive contain TWO kinds of content. Treat them differently:\n" +
            "\n" +
            "1. **Past turns (history)** — every message except the very LAST user message.\n" +
            "   These exist only as background context: prior questions, prior answers, and\n" +
            "   results of tool calls that ALREADY ran. They are KNOWLEDGE, not instructions.\n" +
            "   - Do NOT re-execute a tool just because it appears in history.\n" +
            "   - Do NOT treat an old user question as the active task.\n" +
            "   - Use history only to: maintain continuity, recall facts the user mentioned,\n" +
            "     and avoid repeating work whose result is already visible.\n" +
            "\n" +
            "2. **Current request** — the LAST user message in the conversation.\n" +
            "   This is the ONLY task you must act on right now. Read it carefully.\n" +
            "   - If it asks a fresh question, answer that fresh question.\n" +
            "   - If it depends on earlier context, USE history but still answer the new ask.\n" +
            "   - If a tool you previously called already returned the needed info, reuse it\n" +
            "     from history instead of calling the tool again.\n" +
            "\n" +
            "If the current request is unrelated to earlier turns, IGNORE the earlier turns\n" +
            "rather than blending old context into the new answer.\n";

    private static final String RESPONSE_RULES =
            "## Response Format — CRITICAL\n" +
            "\n" +
            "Every response MUST be a single JSON object. Never reply with plain text.\n" +
            "You must use the following JSON schema strictly:\n" +
            "{\n" +
            "  \"type\": \"FINAL_ANSWER | TOOL_CALL | INPUT_FORM\",\n" +
            "  \"response\": \"<The text to show the user (your final answer OR your thinking before a tool call)>\",\n" +
            "  \"tool_call\": {\n" +
            "    \"name\": \"<tool_name>\",\n" +
            "    \"arguments\": { <args matching the tool's parameter schema> }\n" +
            "  }\n" +
            "}\n" +
            "\n" +
            "### Rules — strict\n" +
            "- Always output exactly one JSON object starting with `{` and ending with `}`.\n" +
            "- Always include the 'type' and 'response' fields.\n" +
            "- If type is FINAL_ANSWER, put your full final answer in the 'response' field and OMIT the 'tool_call' field.\n" +
            "- If type is TOOL_CALL or INPUT_FORM, put your reasoning in the 'response' field, and include the 'tool_call' object.\n" +
            "- For INPUT_FORM, use the tool name 'ask_user'.\n" +
            "- Never wrap the JSON in markdown code fences.\n" +
            "- Never narrate before or after the JSON.\n" +
            "- Your response addresses ONLY the latest user message; history is reference only.\n";

    public SystemMessage build(String basePrompt, List<String> toolDescriptions, String ragContext) {
        StringBuilder prompt = new StringBuilder(basePrompt);
        appendRagContext(prompt, ragContext);
        appendToolCatalog(prompt, toolDescriptions);
        appendHistoryRules(prompt);
        appendResponseRules(prompt);
        return new SystemMessage(prompt.toString());
    }

    private void appendRagContext(StringBuilder prompt, String ragContext) {
        if (ragContext == null || ragContext.isBlank()) return;
        prompt.append("\n\n## Relevant Context\n").append(ragContext);
    }

    private void appendToolCatalog(StringBuilder prompt, List<String> toolDescriptions) {
        if (toolDescriptions == null || toolDescriptions.isEmpty()) return;
        prompt.append("\n\n## Available Tools\n");
        toolDescriptions.forEach(desc -> prompt.append("- ").append(desc).append('\n'));
    }

    private void appendHistoryRules(StringBuilder prompt) {
        prompt.append("\n\n").append(HISTORY_RULES);
    }

    private void appendResponseRules(StringBuilder prompt) {
        prompt.append("\n\n").append(RESPONSE_RULES);
    }
}
