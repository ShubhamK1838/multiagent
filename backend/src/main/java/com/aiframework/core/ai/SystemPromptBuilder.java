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
            "## Conversation & Tool-Call History — CRITICAL\n" +
            "\n" +
            "The message list you receive may contain three kinds of content:\n" +
            "\n" +
            "1. **Past conversation turns** — prior user questions and your prior answers.\n" +
            "   Use these only for continuity. Do NOT re-execute work already done.\n" +
            "\n" +
            "2. **Tool call / result pairs** — assistant messages containing a TOOL_CALL you\n" +
            "   already issued, followed by user messages tagged [TOOL_RESULT]. These show\n" +
            "   what you already did and what data you received. Do NOT re-call a tool whose\n" +
            "   result is already present in history.\n" +
            "\n" +
            "3. **The active task** — the user message tagged [CURRENT REQUEST].\n" +
            "   This is the goal you must complete. You stay on this task across ALL\n" +
            "   iterations until you can give a complete FINAL_ANSWER.\n" +
            "   - After receiving a [TOOL_RESULT], analyse it and decide your NEXT action\n" +
            "     (another TOOL_CALL or a FINAL_ANSWER). Never stop early.\n" +
            "   - A [TOOL_RESULT] message is NOT a new user request — it is data for you\n" +
            "     to use. Keep working toward the [CURRENT REQUEST] goal.\n";

    private static final String RESPONSE_RULES =
            "## Response Format — CRITICAL\n" +
            "\n" +
            "Every response MUST be a single JSON object. Never reply with plain text.\n" +
            "You must use exactly one of these three forms:\n" +
            "\n" +
            "**TOOL_CALL** — when you need to call a tool to complete the task:\n" +
            "{\"type\":\"TOOL_CALL\",\"response\":\"<your reasoning>\",\"tool_call\":{\"name\":\"<tool>\",\"arguments\":{<args>}}}\n" +
            "\n" +
            "**INPUT_FORM** — when you need information from the user (use tool name 'ask_user'):\n" +
            "{\"type\":\"INPUT_FORM\",\"response\":\"<your reasoning>\",\"tool_call\":{\"name\":\"ask_user\",\"arguments\":{<schema>}}}\n" +
            "\n" +
            "**FINAL_ANSWER** — only when the task is fully complete and no more tools are needed:\n" +
            "{\"type\":\"FINAL_ANSWER\",\"response\":\"<complete answer to show the user>\"}\n" +
            "\n" +
            "### Multi-step tool chaining — CRITICAL\n" +
            "- You MUST keep calling tools until you have ALL the information needed.\n" +
            "- After receiving a [TOOL_RESULT], if the task is not yet complete, issue ANOTHER TOOL_CALL.\n" +
            "- Only use FINAL_ANSWER when you have gathered everything and can give a complete answer.\n" +
            "- A partial or uncertain answer must NOT be a FINAL_ANSWER — call a tool instead.\n" +
            "\n" +
            "### Format rules — strict\n" +
            "- Always output exactly one JSON object starting with `{` and ending with `}`.\n" +
            "- Always include the 'type' and 'response' fields.\n" +
            "- Never wrap the JSON in markdown code fences.\n" +
            "- Never narrate before or after the JSON.\n";

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
