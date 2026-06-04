package com.aiframework.core.agent;

import com.aiframework.core.ai.ChatStreamingService;
import com.aiframework.core.ai.PersonaProvider;
import com.aiframework.service.SettingsService;
import com.aiframework.service.aimodel.ChatClientProvider;
import com.aiframework.service.monitoring.LogStreamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Answers light, social turns instantly: one streamed completion from a fast model with the
 * persona prompt and no tools / no agent loop / no swarm. This is the "fast path" that keeps
 * casual conversation snappy instead of paying full agent latency.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FastResponder {

    private final ChatClientProvider chatClientProvider;
    private final ChatStreamingService chatStreamingService;
    private final PersonaProvider personaProvider;
    private final SettingsService settings;
    private final CancellationService cancellationService;
    private final LogStreamService logStreamService;
    private final TurnSupport turnSupport;

    @Async
    public void run(String conversationId, List<Message> history, String userMessage) {
        cancellationService.clear(conversationId);
        logStreamService.agent("FASTPATH", "⚡ FAST_REPLY conv=" + shortId(conversationId));
        turnSupport.publishStart(conversationId, userMessage);
        try {
            List<Message> messages = new ArrayList<>();
            messages.add(new SystemMessage(personaProvider.conversationalPrompt()));
            if (history != null) messages.addAll(history);
            messages.add(new UserMessage(userMessage));

            String answer = chatStreamingService.stream(resolveClient(), messages, conversationId, true);

            if (cancellationService.isCancelled(conversationId)) {
                turnSupport.publishEnd(conversationId, "Agent execution was cancelled by the user.");
                return;
            }
            turnSupport.publishEnd(conversationId, answer);
            turnSupport.triggerMemory(conversationId);
        } catch (Exception e) {
            log.error("Fast responder failed for conv {}: {}", conversationId, e.getMessage(), e);
            turnSupport.publishEnd(conversationId, turnSupport.friendlyError(e));
        } finally {
            cancellationService.clear(conversationId);
        }
    }

    private ChatClient resolveClient() {
        String modelId = settings.get("agent.fastpath.model_id", "");
        if (modelId != null && !modelId.isBlank()) {
            try {
                return chatClientProvider.getForModel(UUID.fromString(modelId.trim()));
            } catch (Exception e) {
                log.warn("Fast-path model '{}' unavailable, using default: {}", modelId, e.getMessage());
            }
        }
        return chatClientProvider.getDefault();
    }

    private String shortId(String conversationId) {
        return conversationId.length() >= 8 ? conversationId.substring(0, 8) : conversationId;
    }
}
