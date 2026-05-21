package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMResponse;
import com.aiframework.core.ai.LLMService;
import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import com.aiframework.core.rag.RAGService;
import com.aiframework.core.tool.ToolDispatcher;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolRegistry;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.aiframework.service.SettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class AgentOrchestrator {

    private final LLMService llmService;
    private final ToolRegistry toolRegistry;
    private final ToolDispatcher toolDispatcher;
    private final RAGService ragService;
    private final EventBus eventBus;
    private final SettingsService settings;

    @Async
    public void run(String conversationId, List<Message> history, String userMessage) {
        eventBus.publish(AgentEvent.of(EventType.AGENT_START, conversationId, userMessage));

        List<Message> messages = buildMessages(history, userMessage);
        int maxIterations = settings.getInt("agent.max_iterations", 10);

        for (int i = 0; i < maxIterations; i++) {
            LLMResponse response = llmService.chat(messages, conversationId);

            if (!response.isToolCall()) {
                eventBus.publish(AgentEvent.of(EventType.AGENT_END, conversationId, response.getContent()));
                return;
            }

            if (response.getReasoning() != null && !response.getReasoning().isBlank()) {
                eventBus.publishThinking(conversationId, response.getReasoning());
            }

            ToolExecutionResult result = executeToolCall(response, conversationId, messages);
            if (result == null || result.isRequiresUserInput()) return;

            appendToolExchange(messages, response, result);
        }

        eventBus.publish(AgentEvent.of(EventType.AGENT_END, conversationId,
                "Maximum iterations reached. Please refine your request."));
    }

    private List<Message> buildMessages(List<Message> history, String userMessage) {
        boolean ragEnabled = settings.getBoolean("rag.enabled", true);
        String ragContext = ragEnabled ? ragService.search(userMessage) : "";
        String basePrompt = settings.get("llm.system_prompt", "You are a helpful AI assistant.");

        List<ToolDefinitionEntity> tools = toolRegistry.getEnabledTools();
        List<String> toolDescriptions = tools.stream()
                .map(t -> String.format("%s: %s | Parameters: %s",
                        t.getName(), t.getDescription(), t.getParametersSchema()))
                .collect(Collectors.toList());

        List<Message> messages = new ArrayList<>();
        messages.add(llmService.buildSystemMessage(basePrompt, toolDescriptions, ragContext));
        messages.addAll(history);
        messages.add(new UserMessage(userMessage));
        return messages;
    }

    private ToolExecutionResult executeToolCall(LLMResponse response, String conversationId, List<Message> messages) {
        try {
            ToolDefinitionEntity tool = toolRegistry.findByName(response.getToolName());
            return toolDispatcher.dispatch(tool, response.getToolArguments(), conversationId);
        } catch (IllegalArgumentException e) {
            String available = toolRegistry.getEnabledTools().stream()
                    .map(ToolDefinitionEntity::getName).collect(Collectors.joining(", "));
            messages.add(new UserMessage("Tool '" + response.getToolName() +
                    "' not found. Available: " + available));
            return null;
        }
    }

    private void appendToolExchange(List<Message> messages, LLMResponse response, ToolExecutionResult result) {
        String toolCallJson = String.format(
                "{\"reasoning\":\"%s\",\"tool_call\":{\"name\":\"%s\",\"arguments\":%s}}",
                response.getReasoning(), response.getToolName(), response.getToolArguments());
        messages.add(new AssistantMessage(toolCallJson));

        String resultContent = result.isSuccess() ? result.getResult() : "Error: " + result.getError();
        messages.add(new UserMessage("Tool result for " + response.getToolName() + ": " + resultContent));
    }
}
