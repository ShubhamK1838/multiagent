package com.aiframework.service.search;

import com.aiframework.domain.entity.Conversation;
import com.aiframework.domain.entity.MessageEntity;
import com.aiframework.domain.repository.ConversationRepository;
import com.aiframework.domain.repository.MessageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Hybrid (keyword + semantic) search across all stored chat messages.
 *
 * Reuses the same Ollama embedding model as {@link com.aiframework.core.rag.RAGService}
 * and the pgvector {@code <=>} cosine operator for the semantic leg.
 */
@Slf4j
@Service
public class ConversationSearchService {

    private final EmbeddingModel embeddingModel;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    public ConversationSearchService(@Qualifier("ollamaEmbeddingModel") EmbeddingModel embeddingModel,
                                     MessageRepository messageRepository,
                                     ConversationRepository conversationRepository) {
        this.embeddingModel = embeddingModel;
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
    }

    /** A single search hit, enriched with its parent conversation's title. */
    public record SearchResult(
            UUID messageId,
            UUID conversationId,
            String conversationTitle,
            String role,
            String snippet,
            String matchType,   // "keyword" | "semantic"
            Instant createdAt
    ) {}

    public List<SearchResult> search(String query, int limit) {
        if (query == null || query.isBlank()) return List.of();
        int perLeg = Math.max(1, limit);

        // De-dupe by message id; keyword hits take precedence (exact matches first).
        Map<UUID, MessageEntity> byId = new LinkedHashMap<>();
        Map<UUID, String> matchType = new LinkedHashMap<>();

        try {
            List<MessageEntity> keyword =
                    messageRepository.searchByKeyword(query, "%" + query + "%", perLeg);
            for (MessageEntity m : keyword) {
                byId.putIfAbsent(m.getId(), m);
                matchType.putIfAbsent(m.getId(), "keyword");
            }
        } catch (Exception e) {
            log.warn("Keyword search leg failed: {}", e.getMessage());
        }

        try {
            float[] embedding = embeddingModel.embed(query);
            List<MessageEntity> semantic = messageRepository.findSimilarMessages(embedding, perLeg);
            for (MessageEntity m : semantic) {
                byId.putIfAbsent(m.getId(), m);
                matchType.putIfAbsent(m.getId(), "semantic");
            }
        } catch (Exception e) {
            log.warn("Semantic search leg failed (embeddings unavailable?): {}", e.getMessage());
        }

        if (byId.isEmpty()) return List.of();

        // Batch-load parent conversation titles.
        List<UUID> convIds = byId.values().stream()
                .map(MessageEntity::getConversationId)
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, String> titles = conversationRepository.findAllById(convIds).stream()
                .collect(Collectors.toMap(Conversation::getId,
                        c -> c.getTitle() != null ? c.getTitle() : "Untitled"));

        List<SearchResult> results = new ArrayList<>();
        for (MessageEntity m : byId.values()) {
            results.add(new SearchResult(
                    m.getId(),
                    m.getConversationId(),
                    titles.getOrDefault(m.getConversationId(), "Untitled"),
                    m.getRole(),
                    snippet(m.getContent(), query),
                    matchType.get(m.getId()),
                    m.getCreatedAt()
            ));
        }
        return results.stream().limit(limit).collect(Collectors.toList());
    }

    /** Embed a single message in the background so it becomes semantically searchable. */
    @Async
    public void embedMessage(UUID messageId, String content) {
        if (messageId == null || content == null || content.isBlank()) return;
        try {
            float[] embedding = embeddingModel.embed(content);
            messageRepository.updateEmbedding(messageId, embedding);
        } catch (Exception e) {
            log.warn("Failed to embed message {}: {}", messageId, e.getMessage());
        }
    }

    /** Backfill embeddings for existing messages that don't have one yet. */
    public int backfillAll(int batchSize) {
        int total = 0;
        List<MessageEntity> batch;
        while (!(batch = messageRepository.findMissingEmbeddings(batchSize)).isEmpty()) {
            for (MessageEntity m : batch) {
                try {
                    float[] embedding = embeddingModel.embed(m.getContent());
                    messageRepository.updateEmbedding(m.getId(), embedding);
                    total++;
                } catch (Exception e) {
                    log.warn("Backfill failed for message {}: {}", m.getId(), e.getMessage());
                }
            }
            if (batch.size() < batchSize) break;
        }
        log.info("Backfilled embeddings for {} messages", total);
        return total;
    }

    /** Build a short context window around the first keyword occurrence. */
    private String snippet(String content, String query) {
        if (content == null) return "";
        String flat = content.replaceAll("\\s+", " ").trim();
        int idx = flat.toLowerCase().indexOf(query.toLowerCase());
        if (idx < 0) {
            return flat.length() <= 220 ? flat : flat.substring(0, 220) + "…";
        }
        int start = Math.max(0, idx - 80);
        int end = Math.min(flat.length(), idx + query.length() + 140);
        String s = flat.substring(start, end);
        return (start > 0 ? "…" : "") + s + (end < flat.length() ? "…" : "");
    }
}
