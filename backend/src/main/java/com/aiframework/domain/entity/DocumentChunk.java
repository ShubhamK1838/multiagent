package com.aiframework.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "document_chunks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentChunk {
    @Id
    private UUID id;

    private UUID documentId;
    private Integer chunkIndex;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "vector(768)")
    private float[] embedding;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = Instant.now();
    }
}
