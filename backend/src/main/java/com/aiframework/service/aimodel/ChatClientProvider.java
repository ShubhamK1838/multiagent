package com.aiframework.service.aimodel;

import com.aiframework.domain.entity.AiModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatClientProvider {

    private final AiModelService aiModelService;
    private final ChatModelFactory chatModelFactory;
    private final ConcurrentMap<UUID, ChatClient> clientCache = new ConcurrentHashMap<>();

    public ChatClient getDefault() {
        AiModel model = aiModelService.getDefault();
        return getForModel(model);
    }

    public ChatClient getForModel(UUID modelId) {
        AiModel model = aiModelService.getById(modelId);
        return getForModel(model);
    }

    private ChatClient getForModel(AiModel model) {
        return clientCache.computeIfAbsent(model.getId(), id -> buildClient(model));
    }

    private ChatClient buildClient(AiModel model) {
        log.info("Building ChatClient for model '{}' ({}/{})",
                model.getName(), model.getProvider(), model.getModelId());
        ChatModel chatModel = chatModelFactory.build(model);
        return ChatClient.builder(chatModel).build();
    }

    @EventListener
    public void onAiModelChanged(AiModelChangedEvent event) {
        switch (event.type()) {
            case UPDATED, DELETED -> invalidate(event.modelId());
            case DEFAULT_CHANGED -> invalidateAll();
        }
    }

    public void invalidate(UUID modelId) {
        ChatClient removed = clientCache.remove(modelId);
        if (removed != null) {
            log.info("Invalidated cached ChatClient for model {}", modelId);
        }
    }

    public void invalidateAll() {
        clientCache.clear();
        log.info("Cleared all cached ChatClients");
    }
}
