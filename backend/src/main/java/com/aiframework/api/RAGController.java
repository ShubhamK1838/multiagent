package com.aiframework.api;

import com.aiframework.core.rag.RAGService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "source", required = false) String source) {
        ragService.ingestFile(file, title, source);
        return Map.of(
                "status", "ingested",
                "filename", file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown");
    }

    @GetMapping("/search")
    public Map<String, String> search(@RequestParam String query) {
        String results = ragService.search(query);
        return Map.of("query", query, "results", results);
    }
}
