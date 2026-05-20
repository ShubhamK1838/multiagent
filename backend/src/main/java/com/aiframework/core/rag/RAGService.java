package com.aiframework.core.rag;

import com.aiframework.domain.entity.DocumentChunk;
import com.aiframework.domain.repository.DocumentChunkRepository;
import com.aiframework.service.SettingsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RAGService {

    private final EmbeddingModel embeddingModel;
    private final DocumentChunkRepository documentChunkRepository;
    private final SettingsService settingsService;

    public String search(String query) {
        try {
            int topK = settingsService.getInt("rag.top_k", 5);
            float[] embedding = embeddingModel.embed(query);
            List<DocumentChunk> chunks = documentChunkRepository.findSimilarChunks(embedding, topK);

            if (chunks.isEmpty()) {
                return "";
            }

            return chunks.stream()
                    .map(chunk -> "Source: " + chunk.getMetadata().getOrDefault("title", "Unknown") +
                            "\n" + chunk.getContent())
                    .collect(Collectors.joining("\n\n---\n\n"));
        } catch (Exception e) {
            log.warn("RAG search failed: {}", e.getMessage());
            return "";
        }
    }

    public void ingestDocument(String title, String source, String content) {
        // Chunk the document
        List<String> chunks = chunkText(content, 512, 50);
        float[] titleEmbedding = embeddingModel.embed(title + "\n" + content.substring(0, Math.min(200, content.length())));

        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            float[] embedding = embeddingModel.embed(chunk);
            DocumentChunk documentChunk = DocumentChunk.builder()
                    .content(chunk)
                    .embedding(embedding)
                    .chunkIndex(i)
                    .metadata(java.util.Map.of("title", title, "source", source))
                    .build();
            documentChunkRepository.save(documentChunk);
        }
        log.info("Ingested document '{}' as {} chunks", title, chunks.size());
    }

    private List<String> chunkText(String text, int chunkSize, int overlap) {
        List<String> chunks = new java.util.ArrayList<>();
        String[] words = text.split("\\s+");
        StringBuilder chunk = new StringBuilder();
        int wordCount = 0;

        for (String word : words) {
            chunk.append(word).append(" ");
            wordCount++;
            if (wordCount >= chunkSize) {
                chunks.add(chunk.toString().trim());
                // Keep last 'overlap' words for context continuity
                String[] chunkWords = chunk.toString().trim().split("\\s+");
                chunk = new StringBuilder();
                int start = Math.max(0, chunkWords.length - overlap);
                for (int i = start; i < chunkWords.length; i++) {
                    chunk.append(chunkWords[i]).append(" ");
                }
                wordCount = overlap;
            }
        }
        if (!chunk.toString().isBlank()) {
            chunks.add(chunk.toString().trim());
        }
        return chunks;
    }
}
