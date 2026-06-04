package com.aiframework.core.agent.multi;

import com.aiframework.domain.entity.AgentDefinition;
import com.aiframework.domain.repository.AgentDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/** Loads the enabled agent team from the database, capped at the configured agent budget. */
@Component
@RequiredArgsConstructor
public class AgentTeamProvider {

    private final AgentDefinitionRepository repository;
    private final MultiAgentSettings settings;

    public AgentTeam loadTeam() {
        int cap = settings.maxAgents();
        List<AgentDefinition> members = repository.findByEnabledTrueOrderBySortOrderAsc().stream()
                .limit(Math.max(1, cap))
                .collect(Collectors.toList());
        return new AgentTeam(members);
    }
}
