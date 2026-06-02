package com.aiframework.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_models")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModel {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AiModelProvider provider;

    @Column(name = "model_id", nullable = false)
    private String modelId;

    @Column(name = "base_url", length = 500)
    private String baseUrl;

    @Column(name = "api_key", columnDefinition = "TEXT")
    private String apiKey;

    @Column(name = "aws_region", length = 50)
    private String awsRegion;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal temperature;

    @Column(name = "max_tokens", nullable = false)
    private Integer maxTokens;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    @Column(name = "is_enabled", nullable = false)
    private boolean isEnabled;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> options;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (options == null) options = new HashMap<>();
        if (temperature == null) temperature = new BigDecimal("0.70");
        if (maxTokens == null) maxTokens = 4096;
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
