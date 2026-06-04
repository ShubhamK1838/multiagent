package com.aiframework.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A configurable agent role in the multi-agent team (e.g. PLANNER, RESEARCHER, CRITIC).
 *
 * <p>Roles are data, not code: new specialised agents can be added by inserting rows, and each
 * role binds to its own model and tool subset — keeping the coordination engine open for
 * extension but closed for modification (OCP). Mirrors {@link ToolDefinitionEntity} / {@link AiModel}.
 */
@Entity
@Table(name = "agent_definitions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentDefinition {

    @Id
    private UUID id;

    /** Stable machine key, matching an {@code AgentRole} name for well-known roles. */
    @Column(name = "role_key", nullable = false, unique = true, length = 100)
    private String roleKey;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "system_prompt", nullable = false, columnDefinition = "TEXT")
    private String systemPrompt;

    /** Model this role uses; {@code null} → fall back to the default chat client. */
    @Column(name = "model_id")
    private UUID modelId;

    /** Tool names this role may call; {@code null}/empty → all enabled tools. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allowed_tools", columnDefinition = "jsonb")
    private List<String> allowedTools;

    @Column(name = "max_iterations", nullable = false)
    private Integer maxIterations;

    /** HUD accent colour for this agent's nodes/cards. */
    @Column(name = "color", length = 32)
    private String color;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (maxIterations == null) maxIterations = 6;
        if (sortOrder == null) sortOrder = 0;
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
