package com.aiframework.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "form_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormRequest {
    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID conversationId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> schema;

    @Column(nullable = false)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> response;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant resolvedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = Instant.now();
        if (status == null) status = "PENDING";
    }
}
