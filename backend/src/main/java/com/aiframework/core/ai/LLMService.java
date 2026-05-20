package com.aiframework.core.ai;

import com.aiframework.core.event.AgentEventPublisher;
import com.aiframework.core.event.EventType;
import com.aiframework.core.event.AgentEvent;
import com.aiframework.service.SettingsService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class LLMService {

    private final ChatClient chatClient;
    private final SettingsService settingsService;
    private final AgentEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    public LLMResponse chat(List<Message> messages, String conversationId) {
        eventPublisher.publish(AgentEvent.of(EventType.RESPONSE_START, conversationId, ""));

        StringBuilder fullResponse = new StringBuilder();
        chatClient.prompt()
                .messages(messages)
                .stream()
                .content()
                .doOnNext(token -> {
                    fullResponse.append(token);
                    eventPublisher.publishToken(conversationId, token);
                })
                .blockLast();

        eventPublisher.publish(AgentEvent.of(EventType.RESPONSE_END, conversationId, ""));

        String response = fullResponse.toString();
        return parseResponse(response);
    }

    private LLMResponse parseResponse(String rawResponse) {
        // Try to detect if the response contains a tool call in JSON format
        // The agent is prompted to output tool calls as structured JSON
        try {
            if (rawResponse.contains("\"tool_call\"")) {
                int jsonStart = rawResponse.indexOf('{');
                int jsonEnd = rawResponse.lastIndexOf('}') + 1;
                if (jsonStart >= 0 && jsonEnd > jsonStart) {
                    String jsonPart = rawResponse.substring(jsonStart, jsonEnd);
                    JsonNode node = objectMapper.readTree(jsonPart);
                    if (node.has("tool_call")) {
                        JsonNode toolCall = node.get("tool_call");
                        String toolName = toolCall.get("name").asText();
                        Map<String, Object> args = objectMapper.convertValue(
                                toolCall.get("arguments"), objectMapper.getTypeFactory()
                                        .constructMapType(Map.class, String.class, Object.class));
                        String reasoning = node.has("reasoning") ? node.get("reasoning").asText() : "";
                        return LLMResponse.toolCall(reasoning, toolName, args);
                    }
                }
            }
        } catch (JsonProcessingException e) {
            log.debug("Response is not a tool call JSON, treating as final answer");
        }
        return LLMResponse.finalAnswer(rawResponse);
    }

    public SystemMessage buildSystemMessage(String basePrompt, List<String> toolDescriptions, String ragContext) {
        StringBuilder systemPrompt = new StringBuilder(basePrompt);

        if (ragContext != null && !ragContext.isBlank()) {
            systemPrompt.append("\n\n## Relevant Context from Knowledge Base\n").append(ragContext);
        }

        if (!toolDescriptions.isEmpty()) {
            systemPrompt.append("\n\n## Available Tools\n");
            systemPrompt.append("When you want to use a tool, respond with ONLY the following JSON format:\n");
            systemPrompt.append("```json\n{\"reasoning\": \"why you need this tool\", \"tool_call\": {\"name\": \"tool_name\", \"arguments\": {}}}\n```\n\n");
            systemPrompt.append("Available tools:\n");
            toolDescriptions.forEach(desc -> systemPrompt.append("- ").append(desc).append("\n"));
            systemPrompt.append("\nWhen you have a final answer, respond naturally in plain text (no JSON).");
        }

        return new SystemMessage(systemPrompt.toString());
    }
}
