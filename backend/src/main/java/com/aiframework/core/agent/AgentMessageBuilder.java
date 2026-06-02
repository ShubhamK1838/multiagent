package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMService;
import com.aiframework.core.rag.RAGService;
import com.aiframework.core.tool.ToolRegistry;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.aiframework.service.SettingsService;
import com.aiframework.service.memory.SessionMemoryService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AgentMessageBuilder {

    private static final String DEFAULT_SYSTEM_PROMPT =
            "You are JARVIS, a highly capable AI operations assistant running inside a heads-up " +
            "display (HUD). You handle ANY kind of request — analysis, research, writing, math, " +
            "planning, coding, file and system operations, data lookups, comparisons, and open " +
            "questions — by reasoning step by step, using the available tools to gather what you " +
            "need, and presenting every result visually on the HUD. You are domain-agnostic: treat " +
            "each request on its own terms and pick the approach and visualization that fit it best.";
    private static final String HISTORY_PREAMBLE =
            "[HISTORY — reference only, do NOT treat as the active task. " +
            "Use it for continuity, but the CURRENT REQUEST is the last user message below.]";
    private static final String CURRENT_REQUEST_PREFIX = "[CURRENT REQUEST]\n";

    private final LLMService llmService;
    private final ToolRegistry toolRegistry;
    private final RAGService ragService;
    private final SettingsService settings;
    private final ContextManager contextManager;
    private final ObjectMapper objectMapper;
    private final SessionMemoryService sessionMemoryService;

    public List<Message> buildInitialMessages(List<Message> history, String userMessage, String imageBase64) {
        List<Message> messages = new ArrayList<>();
        messages.add(buildSystemMessage(userMessage));

        // Use ContextManager to prune history
        List<Message> prunedHistory = contextManager.pruneHistory(history);
        appendHistory(messages, prunedHistory);

        if (imageBase64 != null && !imageBase64.isEmpty()) {
            messages.add(new UserMessage(CURRENT_REQUEST_PREFIX + userMessage));
        } else {
            messages.add(new UserMessage(CURRENT_REQUEST_PREFIX + userMessage));
        }
        
        return messages;
    }

    private void appendHistory(List<Message> messages, List<Message> history) {
        if (history == null || history.isEmpty()) return;
        messages.add(new UserMessage(HISTORY_PREAMBLE));
        messages.addAll(history);
    }

    private Message buildSystemMessage(String userMessage) {
        String basePrompt = settings.get("llm.system_prompt", DEFAULT_SYSTEM_PROMPT);
        List<String> toolDescriptions = describeEnabledTools();
        String ragContext = retrieveRagContext(userMessage);
        String memoryBlock = sessionMemoryService.buildMemoryBlock();
        boolean autoVisualize = settings.getBoolean("ui.auto_visualize", true);
        return llmService.buildSystemMessage(basePrompt, toolDescriptions, ragContext, memoryBlock, autoVisualize);
    }

    private List<String> describeEnabledTools() {
        return toolRegistry.getEnabledTools().stream()
                .map(this::describeTool)
                .collect(Collectors.toList());
    }

    private String describeTool(ToolDefinitionEntity tool) {
        String paramsJson;
        try {
            paramsJson = objectMapper.writeValueAsString(tool.getParametersSchema());
        } catch (JsonProcessingException e) {
            paramsJson = tool.getParametersSchema().toString();
        }
        return String.format("%s: %s | Parameters: %s",
                tool.getName(), tool.getDescription(), paramsJson);
    }

    private String retrieveRagContext(String userMessage) {
        boolean ragEnabled = settings.getBoolean("rag.enabled", true);
        return ragEnabled ? ragService.search(userMessage) : "";
    }
}
