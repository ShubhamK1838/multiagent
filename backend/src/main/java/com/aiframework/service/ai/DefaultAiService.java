package com.aiframework.service.ai;

import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import com.aiframework.service.aimodel.ChatClientProvider;
import java.util.List;
import org.springframework.ai.chat.messages.UserMessage;

@Service
public class DefaultAiService implements AiService {

    private final NaturalLanguageProcessor nlp;
    private final ContextualMemoryService memory;
    private final ChatClientProvider chatClientProvider;

    public DefaultAiService(NaturalLanguageProcessor nlp, ContextualMemoryService memory, ChatClientProvider chatClientProvider) {
        this.nlp = nlp;
        this.memory = memory;
        this.chatClientProvider = chatClientProvider;
    }

    @Override
    public String processCommand(String command) {
        String intent = nlp.parseIntent(command);
        // Basic processing logic based on intent
        if ("greeting".equals(intent)) {
            return "Hello, Sir. How can I assist you today?";
        }

        try {
            ChatClient client = chatClientProvider.getDefault();
            String response = client.prompt()
                .messages(new UserMessage(command))
                .call()
                .content();
            return response != null ? response : "Command received. Processing...";
        } catch (Exception e) {
            return "Command received. Processing... (AI generation failed)";
        }
    }
}
