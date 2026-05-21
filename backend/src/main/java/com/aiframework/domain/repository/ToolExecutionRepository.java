package com.aiframework.domain.repository;

import com.aiframework.domain.entity.ToolExecution;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ToolExecutionRepository extends JpaRepository<ToolExecution, UUID> {
    List<ToolExecution> findByToolNameOrderByExecutedAtDesc(String toolName, Pageable pageable);
    List<ToolExecution> findByConversationIdOrderByExecutedAtDesc(UUID conversationId);
    List<ToolExecution> findAllByOrderByExecutedAtDesc(Pageable pageable);
}
