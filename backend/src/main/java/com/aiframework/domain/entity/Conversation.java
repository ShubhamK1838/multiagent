package com.aiframework.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "conversations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {
    @Id
    private UUID id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(nullable = false)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = updatedAt = Instant.now();
        if (status == null) status = "ACTIVE";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
