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
import java.util.regex.Pattern;

/**
 * Streams chat completions to the SSE bus, but suppresses raw tool-call JSON
 * from reaching the user. Two cases:
 *
 *   1. Response begins with '{' → never publishes tokens (clean tool call).
 *   2. Response begins with prose, then transitions to a tool-call JSON
 *      envelope → publishes prose tokens until the transition is detected,
 *      then emits STREAM_RESET so the frontend wipes the partial bubble.
 *
 * The orchestrator emits THINKING + TOOL_CALL events from the parsed payload,
 * so the user always sees a coherent UI without raw JSON.
 */
@Service
@RequiredArgsConstructor
public class ChatStreamingService {

    private static final Pattern TOOL_CALL_TRANSITION = Pattern.compile(
            "\\{\\s*\"(reasoning|tool_call)\"", Pattern.DOTALL);

    private final ChatClientProvider chatClientProvider;
    private final EventBus eventBus;

    public String streamFromDefault(List<Message> messages, String conversationId) {
        ChatClient client = chatClientProvider.getDefault();
        return stream(client, messages, conversationId);
    }

    public String stream(ChatClient client, List<Message> messages, String conversationId) {
        publishStart(conversationId);
        StreamingState state = new StreamingState();
        consumeStream(client, messages, conversationId, state);
        publishEnd(conversationId);
        return state.accumulator.toString();
    }

    private void consumeStream(ChatClient client, List<Message> messages,
                               String conversationId, StreamingState state) {
        client.prompt()
                .messages(messages)
                .stream()
                .content()
                .doOnNext(token -> handleToken(conversationId, state, token))
                .blockLast();
    }

    private void handleToken(String conversationId, StreamingState state, String token) {
        state.accumulator.append(token);
        if (state.mode == StreamMode.UNKNOWN) {
            state.mode = detectInitialMode(state.accumulator);
        }
        if (state.mode == StreamMode.PROSE && hasTransitionedToToolCall(state.accumulator)) {
            switchToToolCallSilently(conversationId, state);
            return;
        }
        if (state.mode == StreamMode.PROSE) {
            eventBus.publishToken(conversationId, token);
        }
        // TOOL_CALL mode: stay silent.
    }

    private StreamMode detectInitialMode(CharSequence accumulated) {
        for (int i = 0; i < accumulated.length(); i++) {
            char c = accumulated.charAt(i);
            if (Character.isWhitespace(c)) continue;
            if (c == '{' || c == '`') return StreamMode.TOOL_CALL;
            return StreamMode.PROSE;
        }
        return StreamMode.UNKNOWN;
    }

    private boolean hasTransitionedToToolCall(CharSequence accumulated) {
        // Only scan a tail window for performance — tool-call markers are
        // short. 4 KB tail is plenty for any reasonable transition.
        int len = accumulated.length();
        int start = Math.max(0, len - 4096);
        CharSequence tail = accumulated.subSequence(start, len);
        return TOOL_CALL_TRANSITION.matcher(tail).find();
    }

    private void switchToToolCallSilently(String conversationId, StreamingState state) {
        state.mode = StreamMode.TOOL_CALL;
        eventBus.publish(AgentEvent.of(EventType.STREAM_RESET, conversationId, ""));
    }

    private void publishStart(String conversationId) {
        eventBus.publish(AgentEvent.of(EventType.RESPONSE_START, conversationId, ""));
    }

    private void publishEnd(String conversationId) {
        eventBus.publish(AgentEvent.of(EventType.RESPONSE_END, conversationId, ""));
    }

    private enum StreamMode { UNKNOWN, PROSE, TOOL_CALL }

    private static final class StreamingState {
        final StringBuilder accumulator = new StringBuilder();
        StreamMode mode = StreamMode.UNKNOWN;
    }
}
