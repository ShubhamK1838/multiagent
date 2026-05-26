package com.aiframework.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "workflow_steps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStep {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID workflowId;

    @Column(nullable = false)
    private Integer stepOrder;

    @Column(nullable = false)
    private String toolName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> toolArgs;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
    }
}
