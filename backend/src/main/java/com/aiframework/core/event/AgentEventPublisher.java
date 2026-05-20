package com.aiframework.core.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class AgentEventPublisher {

    private final Map<String, Sinks.Many<AgentEvent>> sinks = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public Sinks.Many<AgentEvent> createSink(String conversationId) {
        Sinks.Many<AgentEvent> sink = Sinks.many().multicast().onBackpressureBuffer();
        sinks.put(conversationId, sink);
        return sink;
    }

    public Flux<AgentEvent> subscribe(String conversationId) {
        return sinks.computeIfAbsent(conversationId,
                id -> Sinks.many().multicast().onBackpressureBuffer()).asFlux();
    }

    public void publish(AgentEvent event) {
        Sinks.Many<AgentEvent> sink = sinks.get(event.getConversationId());
        if (sink != null) {
            sink.tryEmitNext(event);
        }
        log.debug("Event: {} - {}", event.getType(), event.getContent());
    }

    public void publishThinking(String conversationId, String thought) {
        publish(AgentEvent.of(EventType.THINKING, conversationId, thought));
    }

    public void publishToolCall(String conversationId, String toolName, Map<String, Object> args) {
        publish(AgentEvent.of(EventType.TOOL_CALL, conversationId, toolName, args));
    }

    public void publishToolResult(String conversationId, String toolName, String result) {
        publish(AgentEvent.of(EventType.TOOL_RESULT, conversationId, result,
                Map.of("tool", toolName)));
    }

    public void publishToken(String conversationId, String token) {
        publish(AgentEvent.of(EventType.TOKEN, conversationId, token));
    }

    public void publishFormRequest(String conversationId, String formId, Object schema) {
        try {
            String schemaJson = objectMapper.writeValueAsString(schema);
            publish(AgentEvent.of(EventType.FORM_REQUEST, conversationId, schemaJson,
                    Map.of("formId", formId)));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize form schema", e);
        }
    }

    public void complete(String conversationId) {
        Sinks.Many<AgentEvent> sink = sinks.remove(conversationId + ":session");
        if (sink != null) {
            sink.tryEmitComplete();
        }
    }
}
