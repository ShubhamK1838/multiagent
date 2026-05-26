package com.aiframework.domain.repository;

import com.aiframework.domain.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {

    Optional<Workflow> findByName(String name);

    List<Workflow> findAllByOrderByNameAsc();

    boolean existsByName(String name);
}
