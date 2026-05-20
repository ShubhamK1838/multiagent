package com.aiframework.domain.repository;

import com.aiframework.domain.entity.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<MessageEntity, UUID> {
    List<MessageEntity> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);
}
