package com.aiframework.api;

import com.aiframework.domain.entity.AgentDefinition;
import com.aiframework.service.agent.AgentDefinitionRequest;
import com.aiframework.service.agent.AgentDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Admin CRUD for the configurable multi-agent team roles. */
@RestController
@RequestMapping("/api/v1/agent-definitions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AgentDefinitionController {

    private final AgentDefinitionService service;

    @GetMapping
    public List<AgentDefinition> list() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    public AgentDefinition getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    public AgentDefinition create(@RequestBody AgentDefinitionRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AgentDefinition update(@PathVariable UUID id, @RequestBody AgentDefinitionRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
