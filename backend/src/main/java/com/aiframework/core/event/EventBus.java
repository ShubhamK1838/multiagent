package com.aiframework.core.event;

import reactor.core.publisher.Flux;

import java.util.Map;

public interface EventBus {
    void publish(AgentEvent event);
    Flux<AgentEvent> subscribe(String conversationId);
    void publishThinking(String conversationId, String thought);
    void publishToolCall(String conversationId, String toolName, Map<String, Object> args);
    void publishToolResult(String conversationId, String toolName, String result);
    void publishToken(String conversationId, String token);
    void publishFormRequest(String conversationId, String formId, Object schema);
}
