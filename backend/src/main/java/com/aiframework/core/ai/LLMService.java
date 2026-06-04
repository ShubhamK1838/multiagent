package com.aiframework.core.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LLMService {

    private final ChatStreamingService chatStreamingService;
    private final SystemPromptBuilder systemPromptBuilder;
    private final ResponseParser responseParser;

    public LLMResponse chat(List<Message> messages, String conversationId) {
        String raw = chatStreamingService.streamFromDefault(messages, conversationId);
        return responseParser.parse(raw);
    }

    /**
     * Runs a completion against a specific {@link ChatClient} (e.g. a per-role agent model).
     *
     * @param streamTokens whether the answer tokens should be streamed to the conversation's SSE
     *                     channel. Background worker agents pass {@code false} so their output does
     *                     not interleave with the user-facing answer stream.
     */
    public LLMResponse chat(List<Message> messages, String conversationId, ChatClient client, boolean streamTokens) {
        String raw = chatStreamingService.stream(client, messages, conversationId, streamTokens);
        return responseParser.parse(raw);
    }

    public SystemMessage buildSystemMessage(String basePrompt, List<String> toolDescriptions, String ragContext) {
        return systemPromptBuilder.build(basePrompt, toolDescriptions, ragContext, "");
    }

    public SystemMessage buildSystemMessage(String basePrompt, List<String> toolDescriptions, String ragContext, String memoryBlock) {
        return systemPromptBuilder.build(basePrompt, toolDescriptions, ragContext, memoryBlock);
    }

    public SystemMessage buildSystemMessage(String basePrompt, List<String> toolDescriptions, String ragContext,
                                            String memoryBlock, boolean autoVisualize) {
        return systemPromptBuilder.build(basePrompt, toolDescriptions, ragContext, memoryBlock, autoVisualize);
    }
}
