package com.aiframework.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "token_usage")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenUsage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "conversation_id")
    private UUID conversationId;

    @Column(name = "message_id")
    private UUID messageId;

    @Column(name = "model_id")
    private UUID modelId;

    @Column(name = "model_name")
    private String modelName;

    @Column(name = "provider")
    private String provider;

    @Column(name = "prompt_tokens", nullable = false)
    private int promptTokens;

    @Column(name = "completion_tokens", nullable = false)
    private int completionTokens;

    @Column(name = "total_tokens", nullable = false)
    private int totalTokens;

    @Column(name = "input_cost", nullable = false, precision = 12, scale = 6)
    private BigDecimal inputCost;

    @Column(name = "output_cost", nullable = false, precision = 12, scale = 6)
    private BigDecimal outputCost;

    @Column(name = "total_cost", nullable = false, precision = 12, scale = 6)
    private BigDecimal totalCost;

    @Column(name = "estimated", nullable = false)
    private boolean estimated;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (inputCost == null) inputCost = BigDecimal.ZERO;
        if (outputCost == null) outputCost = BigDecimal.ZERO;
        if (totalCost == null) totalCost = BigDecimal.ZERO;
    }
}
