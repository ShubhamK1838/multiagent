package com.aiframework.service.ai;

import org.springframework.stereotype.Service;

@Service
public class BasicNLPService implements NaturalLanguageProcessor {
    @Override
    public String parseIntent(String input) {
        if (input == null) return "unknown";
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
