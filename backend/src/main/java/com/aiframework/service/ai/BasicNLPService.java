package com.aiframework.service.ai;

import org.springframework.stereotype.Service;
import com.aiframework.service.aimodel.ChatClientProvider;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class BasicNLPService implements NaturalLanguageProcessor {

    private static final Logger log = LoggerFactory.getLogger(BasicNLPService.class);
    private final ChatClientProvider chatClientProvider;

    public BasicNLPService(ChatClientProvider chatClientProvider) {
        this.chatClientProvider = chatClientProvider;
    }

    @Override
    public String parseIntent(String input) {
        if (input == null) return "unknown";

        try {
            ChatClient client = chatClientProvider.getDefault();
            String prompt = "Classify the intent of the following input into exactly one of these categories: 'greeting', 'diagnostics', 'unknown'. Return only the category word.\n\nInput: " + input;
            String response = client.prompt()
                .messages(new UserMessage(prompt))
                .call()
                .content();

            if (response != null) {
                String intent = response.trim().toLowerCase();
                if (intent.contains("greeting")) return "greeting";
                if (intent.contains("diagnostics")) return "diagnostics";
            }
        } catch (Exception e) {
            log.warn("NLP classification failed, falling back to basic parsing: {}", e.getMessage());
        }

        // Fallback
        String lowerInput = input.toLowerCase();
        if (lowerInput.contains("hello") || lowerInput.contains("hey jarvis")) {
            return "greeting";
        }
        if (lowerInput.contains("status") || lowerInput.contains("diagnostics")) {
            return "diagnostics";
        }
        return "unknown";
    }
}
