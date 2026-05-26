package com.aiframework.core.ai;

import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import com.aiframework.service.aimodel.ChatClientProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

/**
 * Consumes the chat completion stream and returns the full accumulated text.
 *
 * It checks the beginning of the stream: if it starts with '{', it assumes
 * a tool-call JSON and buffers silently. If it starts with anything else, it
 * assumes a FINAL_ANSWER and streams the raw tokens to the UI via TOKEN events.
 *
 * RESPONSE_START / RESPONSE_END markers are still fired so the SSE client can
 * track in-flight model calls.
 */
@Service
@RequiredArgsConstructor
public class ChatStreamingService {

    private final ChatClientProvider chatClientProvider;
    private final EventBus eventBus;

    public String streamFromDefault(List<Message> messages, String conversationId) {
        ChatClient client = chatClientProvider.getDefault();
        return stream(client, messages, conversationId);
    }

    public String stream(ChatClient client, List<Message> messages, String conversationId) {
        publishStart(conversationId);
        StringBuilder accumulator = new StringBuilder();
        consumeStream(client, messages, accumulator, conversationId);
        publishEnd(conversationId);
        return accumulator.toString();
    }

    private void consumeStream(ChatClient client, List<Message> messages, StringBuilder accumulator, String conversationId) {
        // State to track if we should stream to the UI
        boolean[] isJsonDetermined = {false};
        boolean[] isPlainText = {false};

        client.prompt()
                .messages(messages)
                .stream()
                .content()
                .timeout(Duration.ofSeconds(90))
                .doOnNext(token -> {
                    if (token == null || token.isEmpty()) return;
                    accumulator.append(token);

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
