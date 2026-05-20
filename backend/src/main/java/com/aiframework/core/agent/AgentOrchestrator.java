package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMResponse;
import com.aiframework.core.ai.LLMService;
import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.AgentEventPublisher;
import com.aiframework.core.event.EventType;
import com.aiframework.core.rag.RAGService;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolExecutor;
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
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class AgentOrchestrator {

    private final LLMService llmService;
    private final ToolRegistry toolRegistry;
    private final ToolExecutor toolExecutor;
    private final RAGService ragService;
    private final AgentEventPublisher eventPublisher;
    private final SettingsService settingsService;

    @Async
    public void run(String conversationId, List<Message> history, String userMessage) {
        int maxIterations = settingsService.getInt("agent.max_iterations", 10);
        boolean ragEnabled = settingsService.getBoolean("rag.enabled", true);

        eventPublisher.publish(AgentEvent.of(EventType.AGENT_START, conversationId,
                "Starting agent for: " + userMessage));

        // Build context
        String ragContext = ragEnabled ? ragService.search(userMessage) : "";
        String baseSystemPrompt = settingsService.get("llm.system_prompt", "You are a helpful AI assistant.");

        List<ToolDefinitionEntity> enabledTools = toolRegistry.getEnabledTools();
        List<String> toolDescriptions = enabledTools.stream()
                .map(t -> String.format("%s: %s | Parameters: %s", t.getName(), t.getDescription(),
                        t.getParametersSchema().toString()))
                .collect(Collectors.toList());

        Message systemMessage = llmService.buildSystemMessage(baseSystemPrompt, toolDescriptions, ragContext);

        List<Message> messages = new ArrayList<>();
        messages.add(systemMessage);
        messages.addAll(history);
        messages.add(new UserMessage(userMessage));

        // Agent loop
        for (int iteration = 0; iteration < maxIterations; iteration++) {
            eventPublisher.publish(AgentEvent.of(EventType.ITERATION_START, conversationId,
                    "Iteration " + (iteration + 1), Map.of("iteration", iteration + 1)));

            LLMResponse response = llmService.chat(messages, conversationId);

            if (!response.isToolCall()) {
                // Final answer
                eventPublisher.publish(AgentEvent.of(EventType.AGENT_END, conversationId, response.getContent()));
                return;
            }

            // Tool call
            if (response.getReasoning() != null && !response.getReasoning().isBlank()) {
                eventPublisher.publishThinking(conversationId, response.getReasoning());
            }

            String toolName = response.getToolName();
            Map<String, Object> args = response.getToolArguments();

            ToolDefinitionEntity tool;
            try {
                tool = toolRegistry.findByName(toolName);
            } catch (Exception e) {
                String errMsg = "Tool not found: " + toolName;
                eventPublisher.publish(AgentEvent.of(EventType.TOOL_ERROR, conversationId, errMsg));
                messages.add(new AssistantMessage("Tool not found: " + toolName));
                messages.add(new UserMessage("That tool doesn't exist. Available tools: " +
                        enabledTools.stream().map(ToolDefinitionEntity::getName).collect(Collectors.joining(", "))));
                continue;
            }

            ToolExecutionResult result = toolExecutor.execute(tool, args, conversationId);

            if (result.isRequiresUserInput()) {
                // Pause agent loop — wait for form submission
                eventPublisher.publish(AgentEvent.of(EventType.ITERATION_END, conversationId,
                        "Waiting for user input", Map.of("formRequestId", result.getFormRequestId())));
                return;
            }

            // Add tool interaction to message history
            String toolResultContent = result.isSuccess() ? result.getResult() : "Error: " + result.getError();
            messages.add(new AssistantMessage(String.format(
                    "{\"reasoning\":\"%s\",\"tool_call\":{\"name\":\"%s\",\"arguments\":%s}}",
                    response.getReasoning(), toolName, args)));
            messages.add(new UserMessage("Tool result for " + toolName + ": " + toolResultContent));

            eventPublisher.publish(AgentEvent.of(EventType.ITERATION_END, conversationId,
                    "Iteration " + (iteration + 1) + " complete"));
        }

        eventPublisher.publish(AgentEvent.of(EventType.AGENT_END, conversationId,
                "Max iterations reached. Please refine your request."));
    }
}
