package com.aiframework.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "tool_executions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToolExecution {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tool_id")
    private UUID toolId;

    @Column(name = "conversation_id")
    private UUID conversationId;

    @Column(name = "tool_name", nullable = false)
    private String toolName;

    @Column(name = "tool_type", nullable = false)
    private String toolType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_args", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> inputArgs;

    @Column(name = "result_text", columnDefinition = "TEXT")
    private String resultText;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "success", nullable = false)
    private boolean success;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "executed_at", nullable = false)
    private Instant executedAt;

    @PrePersist
    protected void onCreate() {
        if (executedAt == null) executedAt = Instant.now();
    }
}
