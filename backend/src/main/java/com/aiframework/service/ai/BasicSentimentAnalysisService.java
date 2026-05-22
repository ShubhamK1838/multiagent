package com.aiframework.service.ai;

import org.springframework.stereotype.Service;

@Service
public class BasicSentimentAnalysisService implements SentimentAnalysisService {
    @Override
    public String analyzeSentiment(String text) {
        if (text == null) return "neutral";
        String lowerText = text.toLowerCase();
        if (lowerText.contains("happy") || lowerText.contains("good") || lowerText.contains("great")) {
            return "positive";
        }
        if (lowerText.contains("sad") || lowerText.contains("bad") || lowerText.contains("error")) {
            return "negative";
        }
        return "neutral";
    }
}
