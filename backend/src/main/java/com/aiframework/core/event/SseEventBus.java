package com.aiframework.core.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;
import reactor.util.concurrent.Queues;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class SseEventBus implements EventBus {

    private final Map<String, Sinks.Many<AgentEvent>> sinks = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    @Override
    public void publish(AgentEvent event) {
        Sinks.Many<AgentEvent> sink = sinks.get(event.getConversationId());
        if (sink != null) {
            sink.tryEmitNext(event);
        }
        log.debug("Event published: {} for conv={}", event.getType(), event.getConversationId());
    }

    @Override
    public Flux<AgentEvent> subscribe(String conversationId) {
        // autoCancel=false keeps the sink alive when the SSE client disconnects
        // (e.g. user navigates to another view). Otherwise the sink terminates
        // and any later reconnect on the same conversation receives no events.
        return sinks.computeIfAbsent(conversationId,
                id -> Sinks.many().multicast().onBackpressureBuffer(
                        Queues.SMALL_BUFFER_SIZE, false)).asFlux();
    }

    @Override
    public void publishThinking(String conversationId, String thought) {
        publish(AgentEvent.of(EventType.THINKING, conversationId, thought));
    }

    @Override
    public void publishToolCall(String conversationId, String toolName, Map<String, Object> args) {
        publish(AgentEvent.of(EventType.TOOL_CALL, conversationId, toolName, args));
    }

    @Override
    public void publishToolResult(String conversationId, String toolName, String result) {
        publish(AgentEvent.of(EventType.TOOL_RESULT, conversationId, result, Map.of("tool", toolName)));
    }

    @Override
    public void publishToken(String conversationId, String token) {
        publish(AgentEvent.of(EventType.TOKEN, conversationId, token));
    }

    @Override
    public void publishFormRequest(String conversationId, String formId, Object schema) {
        try {
            String schemaJson = objectMapper.writeValueAsString(schema);
            publish(AgentEvent.of(EventType.FORM_REQUEST, conversationId, schemaJson,
                    Map.of("formId", formId)));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize form schema", e);
        }
    }
}
