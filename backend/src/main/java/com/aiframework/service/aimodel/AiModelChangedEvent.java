package com.aiframework.service.aimodel;

import java.util.UUID;

public record AiModelChangedEvent(UUID modelId, ChangeType type) {

    public enum ChangeType { UPDATED, DELETED, DEFAULT_CHANGED }

    public static AiModelChangedEvent updated(UUID id) {
        return new AiModelChangedEvent(id, ChangeType.UPDATED);
    }

    public static AiModelChangedEvent deleted(UUID id) {
        return new AiModelChangedEvent(id, ChangeType.DELETED);
    }

    public static AiModelChangedEvent defaultChanged(UUID id) {
        return new AiModelChangedEvent(id, ChangeType.DEFAULT_CHANGED);
    }
}
