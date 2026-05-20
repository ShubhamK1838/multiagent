package com.aiframework.domain.repository;

import com.aiframework.domain.entity.FormRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FormRequestRepository extends JpaRepository<FormRequest, UUID> {
    List<FormRequest> findByConversationIdAndStatus(UUID conversationId, String status);
}
