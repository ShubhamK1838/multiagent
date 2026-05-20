package com.aiframework.core.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AgentEvent {
    private String id;
    private EventType type;
    private String conversationId;
    private String content;
    private Map<String, Object> metadata;
    private Instant timestamp;

    public static AgentEvent of(EventType type, String conversationId, String content) {
        return AgentEvent.builder()
                .id(UUID.randomUUID().toString())
                .type(type)
                .conversationId(conversationId)
                .content(content)
                .timestamp(Instant.now())
                .build();
    }

    public static AgentEvent of(EventType type, String conversationId, String content, Map<String, Object> metadata) {
        return AgentEvent.builder()
                .id(UUID.randomUUID().toString())
                .type(type)
                .conversationId(conversationId)
                .content(content)
                .metadata(metadata)
                .timestamp(Instant.now())
                .build();
    }
}
