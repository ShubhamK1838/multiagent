package com.aiframework.api;

import com.aiframework.core.agent.AgentRunnerDispatcher;
import com.aiframework.core.agent.CancellationService;
import com.aiframework.core.event.EventBus;
import com.aiframework.domain.entity.Conversation;
import com.aiframework.service.ConversationService;
import com.aiframework.service.proactive.ActiveConversationTracker;
import com.aiframework.service.search.ConversationSearchService;
import com.aiframework.service.search.ConversationSearchService.SearchResult;
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

import com.aiframework.domain.entity.MessageEntity;

@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ConversationService conversationService;
    private final AgentRunnerDispatcher agentRunnerDispatcher;
    private final CancellationService cancellationService;
    private final EventBus eventBus;
    private final ObjectMapper objectMapper;
    private final ActiveConversationTracker activeConversationTracker;
    private final ConversationSearchService conversationSearchService;

    @PostMapping("/conversations")
    public Conversation createConversation(@RequestBody(required = false) Map<String, String> body) {
        String title = body != null ? body.get("title") : null;
        return conversationService.createConversation(title);
    }

    @GetMapping("/conversations")
    public List<Conversation> listConversations() {
        return conversationService.listConversations();
    }

    @DeleteMapping("/conversations/{conversationId}")
    public Map<String, String> deleteConversation(@PathVariable String conversationId) {
        UUID convId = UUID.fromString(conversationId);
        conversationService.deleteConversation(convId);
        return Map.of("status", "deleted", "conversationId", conversationId);
    }

    @GetMapping("/search")
    public List<SearchResult> search(@RequestParam("q") String query,
                                     @RequestParam(value = "limit", defaultValue = "20") int limit) {
        return conversationSearchService.search(query, limit);
    }

    @PostMapping("/search/backfill")
    public Map<String, Object> backfillEmbeddings(
            @RequestParam(value = "batchSize", defaultValue = "100") int batchSize) {
        int count = conversationSearchService.backfillAll(batchSize);
        return Map.of("embedded", count);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<MessageEntity> getMessages(@PathVariable String conversationId) {
        UUID convId = UUID.fromString(conversationId);
        return conversationService.getMessageEntities(convId);
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public Map<String, String> sendMessage(
            @PathVariable String conversationId,
            @RequestBody Map<String, String> body) {

        String userMessage = body.get("message");
        String imageBase64 = body.get("image");
        UUID convId = UUID.fromString(conversationId);

        activeConversationTracker.setActive(conversationId);
        conversationService.saveMessage(convId, "user", userMessage);
        var history = conversationService.getHistory(convId);
        // Remove the last message we just added (it's passed separately)
        if (!history.isEmpty()) {
            history = history.subList(0, history.size() - 1);
        }
        
        // Truncate history to the last 20 messages to prevent context bloat and slow responses
        if (history.size() > 20) {
            history = history.subList(history.size() - 20, history.size());
        }

        agentRunnerDispatcher.run(conversationId, history, userMessage, imageBase64);
        return Map.of("status", "processing", "conversationId", conversationId);
    }

    @PostMapping("/conversations/{conversationId}/cancel")
    public Map<String, String> cancelExecution(@PathVariable String conversationId) {
        cancellationService.cancel(conversationId);
        return Map.of("status", "cancelled", "conversationId", conversationId);
    }

    @GetMapping(value = "/conversations/{conversationId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamEvents(@PathVariable String conversationId) {
        return eventBus.subscribe(conversationId)
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
