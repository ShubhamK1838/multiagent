package com.aiframework.domain.repository;

import com.aiframework.domain.entity.ConversationSummary;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationSummaryRepository extends JpaRepository<ConversationSummary, UUID> {

    List<ConversationSummary> findByOrderByCreatedAtDesc(Pageable pageable);

    Optional<ConversationSummary> findByConversationId(UUID conversationId);

    void deleteByConversationId(UUID conversationId);
}
