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
 */
@Component
public class SystemPromptBuilder {

    private static final String HISTORY_RULES =
            "## Conversation & Tool-Call History\n" +
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
            "   This is the goal you must complete.\n" +
            "   - After receiving a [TOOL_RESULT], decide: do you now have enough to answer? If yes, give FINAL_ANSWER. If not, issue the next TOOL_CALL.\n" +
            "   - A [TOOL_RESULT] is data for you to use, not a new request.\n";

    private static final String RESPONSE_RULES =
            "## Response Format\n" +
            "\n" +
            "You must use exactly one of these three forms:\n" +
            "\n" +
            "**TOOL_CALL** — when you need external data or to perform a system action. MUST be a single JSON object:\n" +
            "{\"type\":\"TOOL_CALL\",\"response\":\"<your reasoning>\",\"tool_call\":{\"name\":\"<tool_name>\",\"arguments\":{<args>}}}\n" +
            "\n" +
            "**INPUT_FORM** — when you need information from the user (use tool name 'ask_user'). MUST be a single JSON object:\n" +
            "{\"type\":\"INPUT_FORM\",\"response\":\"<your reasoning>\",\"tool_call\":{\"name\":\"ask_user\",\"arguments\":{<schema>}}}\n" +
            "\n" +
            "**FINAL_ANSWER** — when you can answer from your own knowledge or from completed tool results. MUST be plain markdown text, NOT JSON.\n" +
            "Write your answer directly without any JSON wrapper.\n" +
            "\n" +
            "### CRITICAL — JSON envelope rules\n" +
            "- The `type` field is ALWAYS one of the three literals: `\"TOOL_CALL\"`, `\"INPUT_FORM\"`, or never used for FINAL_ANSWER.\n" +
            "- **NEVER** put the tool name in the `type` field. The tool name belongs ONLY in `tool_call.name`.\n" +
            "- Wrong: `{\"type\":\"list_files\",\"response\":\"...\"}` — this is invalid.\n" +
            "- Correct: `{\"type\":\"TOOL_CALL\",\"response\":\"...\",\"tool_call\":{\"name\":\"list_files\",\"arguments\":{\"path\":\"/home\"}}}`\n" +
            "\n" +
            "### When to use a tool vs. answer directly\n" +
            "You are an active AI assistant (like J.A.R.V.I.S.) that takes real actions. When a user asks you to DO something, USE the appropriate tool — do NOT explain how to do it manually.\n" +
            "- \"run/execute/use [command]\" → `execute_command` tool\n" +
            "- \"list/show files\" → `list_files` tool\n" +
            "- \"show tables / query the db\" → use the database tool\n" +
            "- \"open file\" → `open_file` tool\n" +
            "- \"system info\" → `get_system_info` tool\n" +
            "- \"search files\" → `search_files` tool\n" +
            "**Answer directly** (FINAL_ANSWER, no tool) ONLY for: greetings, pure knowledge questions, code explanations, and genuinely conversational requests where no tool applies.\n" +
            "\n" +
            "### Multi-step tasks\n" +
            "- Chain tool calls one at a time when a task requires multiple steps.\n" +
            "- After each [TOOL_RESULT], either issue the next TOOL_CALL or give a FINAL_ANSWER if the task is complete.\n" +
            "- Stop as soon as you have enough information — do not call unnecessary extra tools.\n" +
            "\n" +
            "### Format rules\n" +
            "- Tool calls: one JSON object, starts with `{`, ends with `}`, no markdown fences.\n" +
            "- Final answers: plain markdown, no JSON.\n";

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
