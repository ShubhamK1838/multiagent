package com.aiframework.domain.repository;

import com.aiframework.domain.entity.ToolDefinitionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ToolDefinitionRepository extends JpaRepository<ToolDefinitionEntity, UUID> {
    List<ToolDefinitionEntity> findByEnabledTrue();
    Optional<ToolDefinitionEntity> findByName(String name);
}
