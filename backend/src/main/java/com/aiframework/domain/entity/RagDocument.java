package com.aiframework.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "rag_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagDocument {
    @Id
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String source;

    @Column(name = "content_hash", nullable = false, unique = true)
    private String contentHash;

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
