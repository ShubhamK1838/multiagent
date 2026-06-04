package com.aiframework.domain.repository;

import com.aiframework.domain.entity.AgentDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentDefinitionRepository extends JpaRepository<AgentDefinition, UUID> {
    List<AgentDefinition> findByEnabledTrueOrderBySortOrderAsc();
    List<AgentDefinition> findAllByOrderBySortOrderAsc();
    Optional<AgentDefinition> findByRoleKey(String roleKey);
}
