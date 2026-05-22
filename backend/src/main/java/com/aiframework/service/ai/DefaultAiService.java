package com.aiframework.service.ai;

import org.springframework.stereotype.Service;

@Service
public class DefaultAiService implements AiService {

    private final NaturalLanguageProcessor nlp;
    private final ContextualMemoryService memory;

    public DefaultAiService(NaturalLanguageProcessor nlp, ContextualMemoryService memory) {
        this.nlp = nlp;
        this.memory = memory;
    }

    @Override
    public String processCommand(String command) {
        String intent = nlp.parseIntent(command);
        // Basic processing logic based on intent
        if ("greeting".equals(intent)) {
            return "Hello, Sir. How can I assist you today?";
        }
        return "Command received. Processing...";
    }
}
