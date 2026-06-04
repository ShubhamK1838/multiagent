package com.aiframework.domain.repository;

import com.aiframework.domain.entity.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<MessageEntity, UUID> {
    List<MessageEntity> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    /** Keyword search: full-text match OR substring (ILIKE), most recent first. */
    @Query(value = "SELECT * FROM messages " +
            "WHERE to_tsvector('english', content) @@ plainto_tsquery('english', :q) " +
            "   OR content ILIKE :like " +
            "ORDER BY created_at DESC LIMIT :limit",
            nativeQuery = true)
    List<MessageEntity> searchByKeyword(@Param("q") String q, @Param("like") String like, @Param("limit") int limit);

    /** Semantic search: nearest messages by cosine distance (mirrors DocumentChunkRepository). */
    @Query(value = "SELECT * FROM messages WHERE embedding IS NOT NULL " +
            "ORDER BY embedding <=> cast(:embedding as vector) LIMIT :limit",
            nativeQuery = true)
    List<MessageEntity> findSimilarMessages(@Param("embedding") float[] embedding, @Param("limit") int limit);

    /** Messages still missing an embedding — used by the backfill job. */
    @Query(value = "SELECT * FROM messages WHERE embedding IS NULL " +
            "AND content IS NOT NULL AND content <> '' LIMIT :limit",
            nativeQuery = true)
    List<MessageEntity> findMissingEmbeddings(@Param("limit") int limit);

    @Modifying
    @Transactional
    @Query(value = "UPDATE messages SET embedding = cast(:embedding as vector) WHERE id = :id",
            nativeQuery = true)
    void updateEmbedding(@Param("id") UUID id, @Param("embedding") float[] embedding);
}
