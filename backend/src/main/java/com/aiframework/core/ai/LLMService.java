package com.aiframework.core.ai;

import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LLMService {

    private final ChatClient chatClient;
    private final ResponseParser responseParser;
    private final EventBus eventBus;

    public LLMResponse chat(List<Message> messages, String conversationId) {
        eventBus.publish(AgentEvent.of(EventType.RESPONSE_START, conversationId, ""));
        StringBuilder fullResponse = new StringBuilder();

        chatClient.prompt()
                .messages(messages)
                .stream()
                .content()
                .doOnNext(token -> {
                    fullResponse.append(token);
                    eventBus.publishToken(conversationId, token);
                })
                .blockLast();

        eventBus.publish(AgentEvent.of(EventType.RESPONSE_END, conversationId, ""));
        return responseParser.parse(fullResponse.toString());
    }

    public SystemMessage buildSystemMessage(String basePrompt, List<String> toolDescriptions, String ragContext) {
        StringBuilder prompt = new StringBuilder(basePrompt);

        if (ragContext != null && !ragContext.isBlank()) {
            prompt.append("\n\n## Relevant Context\n").append(ragContext);
        }

        if (!toolDescriptions.isEmpty()) {
            prompt.append("\n\n## Available Tools\n");
            prompt.append("To use a tool, respond with ONLY this JSON:\n");
            prompt.append("```json\n{\"reasoning\": \"why\", \"tool_call\": {\"name\": \"tool_name\", \"arguments\": {}}}\n```\n\n");
            toolDescriptions.forEach(d -> prompt.append("- ").append(d).append("\n"));
            prompt.append("\nFor a final answer, respond in plain text (no JSON).");
        }

        return new SystemMessage(prompt.toString());
    }
}
