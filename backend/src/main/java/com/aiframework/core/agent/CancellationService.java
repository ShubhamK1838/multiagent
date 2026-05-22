package com.aiframework.core.agent;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CancellationService {

    private final Set<String> cancelledConversations = ConcurrentHashMap.newKeySet();

    public void cancel(String conversationId) {
        cancelledConversations.add(conversationId);
    }

    public boolean isCancelled(String conversationId) {
        return cancelledConversations.contains(conversationId);
    }

    public void clear(String conversationId) {
        cancelledConversations.remove(conversationId);
    }
}
