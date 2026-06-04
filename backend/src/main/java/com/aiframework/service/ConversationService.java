package com.aiframework.service;

import com.aiframework.domain.entity.Conversation;
import com.aiframework.domain.entity.MessageEntity;
import com.aiframework.domain.repository.ConversationRepository;
import com.aiframework.domain.repository.MessageRepository;
import com.aiframework.service.search.ConversationSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ConversationSearchService conversationSearchService;

    @Transactional
    public Conversation createConversation(String title) {
        Conversation conversation = Conversation.builder()
                .title(title != null ? title : "New Conversation")
                .status("ACTIVE")
                .build();
        return conversationRepository.save(conversation);
    }

    @Transactional
    public MessageEntity saveMessage(UUID conversationId, String role, String content) {
        ensureConversationExists(conversationId);
        MessageEntity message = MessageEntity.builder()
                .conversationId(conversationId)
                .role(role)
                .content(content)
                .build();
        MessageEntity saved = messageRepository.save(message);
        // Fire-and-forget: make the message semantically searchable (Feature: Conversation Search).
        conversationSearchService.embedMessage(saved.getId(), saved.getContent());
        return saved;
    }

    private void ensureConversationExists(UUID conversationId) {
        if (!conversationRepository.existsById(conversationId)) {
            Conversation conversation = Conversation.builder()
                    .id(conversationId)
                    .title("New Conversation")
                    .status("ACTIVE")
                    .build();
            conversationRepository.save(conversation);
        }
    }

    public List<Message> getHistory(UUID conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(m -> "user".equals(m.getRole())
                        ? (Message) new UserMessage(m.getContent())
                        : new AssistantMessage(m.getContent()))
                .collect(Collectors.toList());
    }

    public List<MessageEntity> getMessageEntities(UUID conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public List<Conversation> listConversations() {
        return conversationRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
    }

    @Transactional
    public void deleteConversation(UUID conversationId) {
        // FK ON DELETE CASCADE on messages, form_requests, agent_events
        // takes care of dependent rows.
        conversationRepository.deleteById(conversationId);
    }
}
