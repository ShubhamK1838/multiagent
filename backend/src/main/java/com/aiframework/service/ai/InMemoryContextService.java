package com.aiframework.service.ai;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class InMemoryContextService implements ContextualMemoryService {

    private final Map<String, Map<String, String>> userContexts = new ConcurrentHashMap<>();

    @Override
    public void storeContext(String userId, String key, String value) {
        userContexts.computeIfAbsent(userId, k -> new ConcurrentHashMap<>()).put(key, value);
    }

    @Override
    public String retrieveContext(String userId, String key) {
        Map<String, String> context = userContexts.get(userId);
        return context != null ? context.get(key) : null;
    }
}
