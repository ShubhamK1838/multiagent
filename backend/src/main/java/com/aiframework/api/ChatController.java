package com.aiframework.api;

import com.aiframework.core.agent.AgentOrchestrator;
import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.AgentEventPublisher;
import com.aiframework.domain.entity.Conversation;
import com.aiframework.service.ConversationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ConversationService conversationService;
    private final AgentOrchestrator agentOrchestrator;
    private final AgentEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    @PostMapping("/conversations")
    public Conversation createConversation(@RequestBody(required = false) Map<String, String> body) {
        String title = body != null ? body.get("title") : null;
        return conversationService.createConversation(title);
    }

    @GetMapping("/conversations")
    public List<Conversation> listConversations() {
        return conversationService.listConversations();
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public Map<String, String> sendMessage(
            @PathVariable String conversationId,
            @RequestBody Map<String, String> body) {

        String userMessage = body.get("message");
        UUID convId = UUID.fromString(conversationId);

        conversationService.saveMessage(convId, "user", userMessage);
        var history = conversationService.getHistory(convId);
        // Remove the last message we just added (it's passed separately)
        if (!history.isEmpty()) {
            history = history.subList(0, history.size() - 1);
        }

        agentOrchestrator.run(conversationId, history, userMessage);
        return Map.of("status", "processing", "conversationId", conversationId);
    }

    @GetMapping(value = "/conversations/{conversationId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamEvents(@PathVariable String conversationId) {
        return eventPublisher.subscribe(conversationId)
                .map(event -> {
                    try {
                        String data = objectMapper.writeValueAsString(event);
                        return ServerSentEvent.<String>builder()
                                .id(event.getId())
                                .event(event.getType().name())
                                .data(data)
                                .build();
                    } catch (Exception e) {
                        return ServerSentEvent.<String>builder()
                                .event("ERROR")
                                .data("{\"error\":\"serialization failed\"}")
                                .build();
                    }
                });
    }
}
