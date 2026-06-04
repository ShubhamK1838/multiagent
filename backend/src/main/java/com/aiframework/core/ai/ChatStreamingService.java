package com.aiframework.core.ai;

import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import com.aiframework.domain.entity.AiModel;
import com.aiframework.service.aimodel.AiModelService;
import com.aiframework.service.aimodel.ChatClientProvider;
import com.aiframework.service.usage.TokenUsageLogger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Consumes the chat completion stream and returns the full accumulated text.
 *
 * It checks the beginning of the stream: if it starts with '{', it assumes
 * a tool-call JSON and buffers silently. If it starts with anything else, it
 * assumes a FINAL_ANSWER and streams the raw tokens to the UI via TOKEN events.
 *
 * RESPONSE_START / RESPONSE_END markers are still fired so the SSE client can
 * track in-flight model calls.
 *
 * As a side effect it records per-completion token usage (Feature: Token & Cost
 * Dashboard) — using the provider-reported {@code Usage} when available, or a
 * character-based estimate otherwise.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatStreamingService {

    private final ChatClientProvider chatClientProvider;
    private final EventBus eventBus;
    private final AiModelService aiModelService;
    private final TokenUsageLogger tokenUsageLogger;

    /** Mutable holder for usage metadata captured during streaming. */
    private static final class UsageCapture {
        int promptTokens;
        int completionTokens;
    }

    public String streamFromDefault(List<Message> messages, String conversationId) {
        ChatClient client = chatClientProvider.getDefault();
        return stream(client, messages, conversationId);
    }

    public String stream(ChatClient client, List<Message> messages, String conversationId) {
        return stream(client, messages, conversationId, true);
    }

    /**
     * Streams a completion from the given client.
     *
     * @param streamTokens when {@code true}, RESPONSE_START/END and TOKEN events are published to
     *                     the conversation's SSE channel (used for the user-facing answer). When
     *                     {@code false}, the stream is consumed silently — used by background
     *                     worker agents whose intermediate output must NOT leak onto the main
     *                     answer stream.
     */
    public String stream(ChatClient client, List<Message> messages, String conversationId, boolean streamTokens) {
        if (streamTokens) publishStart(conversationId);
        StringBuilder accumulator = new StringBuilder();
        UsageCapture usage = new UsageCapture();
        try {
            consumeStream(client, messages, accumulator, conversationId, streamTokens, usage);
        } finally {
            if (streamTokens) publishEnd(conversationId);
            recordUsage(conversationId, messages, accumulator.toString(), usage);
        }
        return accumulator.toString();
    }

    private void consumeStream(ChatClient client, List<Message> messages, StringBuilder accumulator,
                               String conversationId, boolean streamTokens, UsageCapture usage) {
        // State to track if we should stream to the UI
        boolean[] isJsonDetermined = {false};
        boolean[] isPlainText = {false};

        client.prompt()
                .messages(messages)
                .stream()
                .chatResponse()
                .timeout(Duration.ofSeconds(90))
                .doOnNext(response -> {
                    captureUsage(response, usage);
                    String token = extractText(response);
                    if (token == null || token.isEmpty()) return;
                    accumulator.append(token);

                    if (!streamTokens) return; // silent consumption for background worker agents

                    if (!isJsonDetermined[0]) {
                        String current = accumulator.toString().stripLeading();
                        if (current.isEmpty()) return; // Wait for non-whitespace

                        if (current.startsWith("{") || current.startsWith("```")) {
                            isJsonDetermined[0] = true;
                            isPlainText[0] = false;
                        } else {
                            // It's definitely not a JSON envelope, so it's a plain text answer
                            isJsonDetermined[0] = true;
                            isPlainText[0] = true;
                            publishToken(conversationId, accumulator.toString());
                        }
                    } else if (isPlainText[0]) {
                        publishToken(conversationId, token);
                    }
                })
                .blockLast();
    }

    private String extractText(ChatResponse response) {
        if (response == null || response.getResult() == null
                || response.getResult().getOutput() == null) {
            return null;
        }
        return response.getResult().getOutput().getText();
    }

    private void captureUsage(ChatResponse response, UsageCapture usage) {
        if (response == null || response.getMetadata() == null) return;
        var u = response.getMetadata().getUsage();
        if (u == null) return;
        Integer pt = u.getPromptTokens();
        Integer ct = u.getCompletionTokens();
        if (pt != null && pt > 0) usage.promptTokens = pt;
        if (ct != null && ct > 0) usage.completionTokens = ct;
    }

    private void recordUsage(String conversationId, List<Message> messages, String answer, UsageCapture usage) {
        try {
            int promptTokens = usage.promptTokens;
            int completionTokens = usage.completionTokens;
            boolean estimated = false;

            // Provider didn't report usage (common for Ollama / OpenAI without stream usage) — estimate.
            if (promptTokens == 0 && completionTokens == 0) {
                if (answer == null || answer.isEmpty()) return; // nothing happened, skip
                String promptText = messages == null ? "" : messages.stream()
                        .map(Message::getText)
                        .filter(Objects::nonNull)
                        .collect(Collectors.joining(" "));
                promptTokens = TokenUsageLogger.estimateTokens(promptText);
                completionTokens = TokenUsageLogger.estimateTokens(answer);
                estimated = true;
            }

            AiModel model;
            try {
                model = aiModelService.getDefault();
            } catch (Exception e) {
                model = null;
            }
            UUID convId = parseUuid(conversationId);
            tokenUsageLogger.record(convId, model, promptTokens, completionTokens, estimated);
        } catch (Exception e) {
            log.warn("Failed to record token usage: {}", e.getMessage());
        }
    }

    private UUID parseUuid(String value) {
        try {
            return value == null ? null : UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            return null; // e.g. "direct" for ad-hoc runs
        }
    }

    private void publishStart(String conversationId) {
        eventBus.publish(AgentEvent.of(EventType.RESPONSE_START, conversationId, ""));
    }

    private void publishEnd(String conversationId) {
        eventBus.publish(AgentEvent.of(EventType.RESPONSE_END, conversationId, ""));
    }

    private void publishToken(String conversationId, String token) {
        eventBus.publish(AgentEvent.of(EventType.TOKEN, conversationId, token));
    }
}
