package com.aiframework.core.agent;

import com.aiframework.service.SettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ContextManager {

    private final SettingsService settingsService;

    // A rough heuristic: 1 token is about 4 characters
    private static final int CHARS_PER_TOKEN = 4;

    /**
     * Truncates the message history to ensure it fits within the context limit.
     * We retain the most recent messages.
     *
     * @param history The full history.
     * @return A safely truncated list of messages.
     */
    public List<Message> pruneHistory(List<Message> history) {
        if (history == null || history.isEmpty()) {
            return new ArrayList<>();
        }

        int maxContextTokens = settingsService.getInt("agent.max_context_size", 4000);
        int maxContextChars = maxContextTokens * CHARS_PER_TOKEN;

        List<Message> pruned = new ArrayList<>();
        int currentChars = 0;

        // Iterate backwards to keep the most recent context
        for (int i = history.size() - 1; i >= 0; i--) {
            Message msg = history.get(i);
            String text = msg.getText() != null ? msg.getText() : "";
            int msgLength = text.length();

            if (currentChars + msgLength <= maxContextChars) {
                pruned.add(0, msg);
                currentChars += msgLength;
            } else {
                log.info("Context limit reached. Pruned {} older messages.", i + 1);
                break;
            }
        }

        return pruned;
    }
}
