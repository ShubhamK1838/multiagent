package com.aiframework.service.ai;

public interface ContextualMemoryService {
    void storeContext(String userId, String key, String value);
    String retrieveContext(String userId, String key);
}
