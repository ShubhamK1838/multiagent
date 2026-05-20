package com.aiframework.domain.repository;

import com.aiframework.domain.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {
    @Query(value = "SELECT * FROM document_chunks ORDER BY embedding <=> cast(:embedding as vector) LIMIT :limit",
            nativeQuery = true)
    List<DocumentChunk> findSimilarChunks(@Param("embedding") float[] embedding, @Param("limit") int limit);
}
