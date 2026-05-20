package com.aiframework.core.tool;

import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.aiframework.domain.repository.ToolDefinitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ToolRegistry {

    private final ToolDefinitionRepository toolDefinitionRepository;

    public List<ToolDefinitionEntity> getEnabledTools() {
        return toolDefinitionRepository.findByEnabledTrue();
    }

    public ToolDefinitionEntity findByName(String name) {
        return toolDefinitionRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Tool not found: " + name));
    }

    public boolean isEnabled(String name) {
        return toolDefinitionRepository.findByName(name)
                .map(ToolDefinitionEntity::isEnabled)
                .orElse(false);
    }
}
