package com.aiframework.api;

import com.aiframework.domain.entity.ConversationSummary;
import com.aiframework.service.memory.SessionMemoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/memory")
@RequiredArgsConstructor
public class MemoryController {

    private final SessionMemoryService sessionMemoryService;

    @GetMapping("/summaries")
    public List<ConversationSummary> listSummaries() {
        return sessionMemoryService.listSummaries();
    }

    @GetMapping("/summaries/{conversationId}")
    public ResponseEntity<ConversationSummary> getSummary(@PathVariable UUID conversationId) {
        return sessionMemoryService.getSummary(conversationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/summaries")
    public Map<String, Integer> clearAll() {
        int deleted = sessionMemoryService.deleteAll();
        return Map.of("deleted", deleted);
    }
}
