package com.aiframework.service.agent;

import com.aiframework.domain.entity.AgentDefinition;
import com.aiframework.domain.repository.AgentDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** CRUD for the configurable multi-agent team roles. */
@Service
@RequiredArgsConstructor
public class AgentDefinitionService {

    private final AgentDefinitionRepository repository;

    public List<AgentDefinition> listAll() {
        return repository.findAllByOrderBySortOrderAsc();
    }

    public AgentDefinition getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agent definition not found: " + id));
    }

    @Transactional
    public AgentDefinition create(AgentDefinitionRequest request) {
        if (request.getRoleKey() == null || request.getRoleKey().isBlank()) {
            throw new IllegalArgumentException("roleKey is required");
        }
        AgentDefinition def = AgentDefinition.builder()
                .roleKey(request.getRoleKey().trim())
                .displayName(orDefault(request.getDisplayName(), request.getRoleKey()))
                .systemPrompt(orDefault(request.getSystemPrompt(), ""))
                .modelId(request.getModelId())
                .allowedTools(request.getAllowedTools())
                .maxIterations(orDefault(request.getMaxIterations(), 6))
                .color(request.getColor())
                .sortOrder(orDefault(request.getSortOrder(), 0))
                .enabled(request.getEnabled() == null ? Boolean.TRUE : request.getEnabled())
                .build();
        return repository.save(def);
    }

    /** Full-update semantics: the settings modal submits the whole record. {@code roleKey} is immutable. */
    @Transactional
    public AgentDefinition update(UUID id, AgentDefinitionRequest request) {
        AgentDefinition existing = getById(id);
        if (request.getDisplayName() != null)  existing.setDisplayName(request.getDisplayName());
        if (request.getSystemPrompt() != null) existing.setSystemPrompt(request.getSystemPrompt());
        existing.setModelId(request.getModelId());          // nullable → null clears the binding
        existing.setAllowedTools(request.getAllowedTools()); // nullable → null means "all tools"
        if (request.getMaxIterations() != null) existing.setMaxIterations(request.getMaxIterations());
        if (request.getColor() != null)         existing.setColor(request.getColor());
        if (request.getSortOrder() != null)     existing.setSortOrder(request.getSortOrder());
        if (request.getEnabled() != null)       existing.setEnabled(request.getEnabled());
        return repository.save(existing);
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(getById(id));
    }

    private static <T> T orDefault(T value, T fallback) {
        return value != null ? value : fallback;
    }
}
