package com.aiframework.api;

import com.aiframework.core.rag.RAGService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/rag")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RAGController {

    private final RAGService ragService;

    @PostMapping("/ingest")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> ingestDocument(@RequestBody Map<String, String> body) {
        ragService.ingestDocument(
                body.get("title"),
                body.getOrDefault("source", ""),
                body.get("content"));
        return Map.of("status", "ingested", "title", body.get("title"));
    }

    @GetMapping("/search")
    public Map<String, String> search(@RequestParam String query) {
        String results = ragService.search(query);
        return Map.of("query", query, "results", results);
    }
}
