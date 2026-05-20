package com.aiframework.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "system_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSetting {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String settingKey;

    @Column(columnDefinition = "TEXT")
    private String settingValue;

    @Column(nullable = false)
    private String settingType;

    @Column(nullable = false)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean isSecret;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
