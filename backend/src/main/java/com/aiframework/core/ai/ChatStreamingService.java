package com.aiframework.core.ai;

import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import com.aiframework.service.aimodel.ChatClientProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Consumes the chat completion stream and returns the full accumulated text.
 *
 * The system prompt requires every response to be a single JSON envelope
 * ({type, response, tool_call?}), so streaming raw tokens to the UI would just
 * expose JSON characters. We buffer silently, then the orchestrator parses the
 * envelope and emits the user-visible content via THINKING / AGENT_END events.
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
        consumeStream(client, messages, accumulator);
        publishEnd(conversationId);
        return accumulator.toString();
    }

    private void consumeStream(ChatClient client, List<Message> messages, StringBuilder accumulator) {
        client.prompt()
                .messages(messages)
                .stream()
                .content()
                .doOnNext(accumulator::append)
                .blockLast();
    }

    private void publishStart(String conversationId) {
        eventBus.publish(AgentEvent.of(EventType.RESPONSE_START, conversationId, ""));
    }

    private void publishEnd(String conversationId) {
        eventBus.publish(AgentEvent.of(EventType.RESPONSE_END, conversationId, ""));
    }
}
