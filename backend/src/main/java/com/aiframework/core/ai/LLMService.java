package com.aiframework.core.ai;

import lombok.RequiredArgsConstructor;
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

    public SystemMessage buildSystemMessage(String basePrompt, List<String> toolDescriptions, String ragContext) {
        return systemPromptBuilder.build(basePrompt, toolDescriptions, ragContext, "");
    }

    public SystemMessage buildSystemMessage(String basePrompt, List<String> toolDescriptions, String ragContext, String memoryBlock) {
        return systemPromptBuilder.build(basePrompt, toolDescriptions, ragContext, memoryBlock);
    }
}
