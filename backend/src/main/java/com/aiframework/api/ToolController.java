package com.aiframework.api;

import com.aiframework.domain.entity.ToolDefinitionEntity;
import com.aiframework.domain.repository.ToolDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tools")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ToolController {

    private final ToolDefinitionRepository toolRepository;

    @GetMapping
    public List<ToolDefinitionEntity> listTools() {
        return toolRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ToolDefinitionEntity createTool(@RequestBody ToolDefinitionEntity tool) {
        tool.setId(null);
        return toolRepository.save(tool);
    }

    @PutMapping("/{id}")
    public ToolDefinitionEntity updateTool(@PathVariable UUID id, @RequestBody ToolDefinitionEntity tool) {
        tool.setId(id);
        return toolRepository.save(tool);
    }

    @PatchMapping("/{id}/toggle")
    public ToolDefinitionEntity toggleTool(@PathVariable UUID id) {
        ToolDefinitionEntity tool = toolRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tool not found: " + id));
        tool.setEnabled(!tool.isEnabled());
        return toolRepository.save(tool);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTool(@PathVariable UUID id) {
        toolRepository.deleteById(id);
    }
}
