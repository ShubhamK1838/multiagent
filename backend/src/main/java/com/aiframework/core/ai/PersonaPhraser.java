package com.aiframework.core.ai;

import com.aiframework.service.SettingsService;
import com.aiframework.service.aimodel.ChatClientProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Rephrases a raw system event (e.g. "JVM heap at 85%") into a short, in-character JARVIS remark
 * so proactive alerts feel alive rather than canned. Gated by {@code persona.phrase_alerts} and
 * fully fail-soft: on disable or any error it returns the original text unchanged. Uses the fast
 * model and a silent stream so it never leaks tokens onto the conversation.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PersonaPhraser {

    private final ChatClientProvider chatClientProvider;
    private final ChatStreamingService chatStreamingService;
    private final PersonaProvider personaProvider;
    private final SettingsService settings;

    public String phrase(String rawFact, String conversationId) {
        if (rawFact == null || rawFact.isBlank()) return rawFact;
        if (!settings.getBoolean("persona.phrase_alerts", false)) return rawFact;
        try {
            List<Message> messages = List.of(
                    new SystemMessage(personaProvider.phrasingPrompt()),
                    new UserMessage(rawFact));
            String out = chatStreamingService.stream(resolveFastClient(), messages, conversationId, false);
            if (out == null || out.isBlank()) return rawFact;
            return stripQuotes(out.trim());
        } catch (Exception e) {
            log.debug("Persona phrasing failed, using raw alert: {}", e.getMessage());
            return rawFact;
        }
    }

    private ChatClient resolveFastClient() {
        String modelId = settings.get("agent.fastpath.model_id", "");
        if (modelId != null && !modelId.isBlank()) {
            try {
                return chatClientProvider.getForModel(UUID.fromString(modelId.trim()));
            } catch (Exception ignored) { /* fall back to default */ }
        }
        return chatClientProvider.getDefault();
    }

    private String stripQuotes(String s) {
        if (s.length() >= 2 && s.startsWith("\"") && s.endsWith("\"")) {
            return s.substring(1, s.length() - 1).trim();
        }
        return s;
    }
}
