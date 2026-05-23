package com.aiframework.service.ai;

import org.springframework.stereotype.Service;
import com.aiframework.service.aimodel.ChatClientProvider;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class BasicSentimentAnalysisService implements SentimentAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(BasicSentimentAnalysisService.class);
    private final ChatClientProvider chatClientProvider;

    public BasicSentimentAnalysisService(ChatClientProvider chatClientProvider) {
        this.chatClientProvider = chatClientProvider;
    }

    @Override
    public String analyzeSentiment(String text) {
        if (text == null) return "neutral";

        try {
            ChatClient client = chatClientProvider.getDefault();
            String prompt = "Analyze the sentiment of the following text and classify it as exactly one of: 'positive', 'negative', 'neutral'. Return only the classification word.\n\nText: " + text;
            String response = client.prompt()
                .messages(new UserMessage(prompt))
                .call()
                .content();

            if (response != null) {
                String sentiment = response.trim().toLowerCase();
                if (sentiment.contains("positive")) return "positive";
                if (sentiment.contains("negative")) return "negative";
                if (sentiment.contains("neutral")) return "neutral";
            }
        } catch (Exception e) {
            log.warn("Sentiment analysis failed, falling back to basic parsing: {}", e.getMessage());
        }

        // Fallback
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
