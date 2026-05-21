package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMService;
import com.aiframework.core.rag.RAGService;
import com.aiframework.core.tool.ToolRegistry;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.aiframework.service.SettingsService;
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

    private static final String DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant.";

    private final LLMService llmService;
    private final ToolRegistry toolRegistry;
    private final RAGService ragService;
    private final SettingsService settings;

    public List<Message> buildInitialMessages(List<Message> history, String userMessage) {
        List<Message> messages = new ArrayList<>();
        messages.add(buildSystemMessage(userMessage));
        messages.addAll(history);
        messages.add(new UserMessage(userMessage));
        return messages;
    }

    private Message buildSystemMessage(String userMessage) {
        String basePrompt = settings.get("llm.system_prompt", DEFAULT_SYSTEM_PROMPT);
        List<String> toolDescriptions = describeEnabledTools();
        String ragContext = retrieveRagContext(userMessage);
        return llmService.buildSystemMessage(basePrompt, toolDescriptions, ragContext);
    }

    private List<String> describeEnabledTools() {
        return toolRegistry.getEnabledTools().stream()
                .map(this::describeTool)
                .collect(Collectors.toList());
    }

    private String describeTool(ToolDefinitionEntity tool) {
        return String.format("%s: %s | Parameters: %s",
                tool.getName(), tool.getDescription(), tool.getParametersSchema());
    }

    private String retrieveRagContext(String userMessage) {
        boolean ragEnabled = settings.getBoolean("rag.enabled", true);
        return ragEnabled ? ragService.search(userMessage) : "";
    }
}
