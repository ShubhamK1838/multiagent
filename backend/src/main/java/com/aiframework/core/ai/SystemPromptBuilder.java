package com.aiframework.core.ai;

import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SystemPromptBuilder {

    private static final String TOOL_INSTRUCTION =
            "To use a tool, respond with ONLY this JSON:\n" +
            "```json\n{\"reasoning\": \"why\", \"tool_call\": {\"name\": \"tool_name\", \"arguments\": {}}}\n```\n";

    private static final String FINAL_ANSWER_INSTRUCTION =
            "For a final answer, respond in plain text (no JSON).";

    public SystemMessage build(String basePrompt, List<String> toolDescriptions, String ragContext) {
        StringBuilder prompt = new StringBuilder(basePrompt);
        appendRagContext(prompt, ragContext);
        appendToolBlock(prompt, toolDescriptions);
        return new SystemMessage(prompt.toString());
    }

    private void appendRagContext(StringBuilder prompt, String ragContext) {
        if (ragContext == null || ragContext.isBlank()) return;
        prompt.append("\n\n## Relevant Context\n").append(ragContext);
    }

    private void appendToolBlock(StringBuilder prompt, List<String> toolDescriptions) {
        if (toolDescriptions == null || toolDescriptions.isEmpty()) return;
        prompt.append("\n\n## Available Tools\n").append(TOOL_INSTRUCTION).append('\n');
        toolDescriptions.forEach(desc -> prompt.append("- ").append(desc).append('\n'));
        prompt.append('\n').append(FINAL_ANSWER_INSTRUCTION);
    }
}
