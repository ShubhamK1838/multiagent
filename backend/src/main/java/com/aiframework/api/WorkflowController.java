package com.aiframework.api;

import com.aiframework.service.workflow.WorkflowService;
import com.aiframework.service.workflow.WorkflowService.WorkflowWithSteps;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping
    public List<WorkflowWithSteps> listWorkflows() {
        return workflowService.listWorkflows();
    }

    @GetMapping("/{name}")
    public ResponseEntity<WorkflowWithSteps> getWorkflow(@PathVariable String name) {
        try {
            return ResponseEntity.ok(workflowService.getWorkflow(name));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createWorkflow(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.getOrDefault("description", "");
        Object rawSteps = body.get("steps");
        if (name == null || rawSteps == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "name and steps are required"));
        }
        @SuppressWarnings("unchecked")
        var steps = (List<Map<String, Object>>) rawSteps;
        return ResponseEntity.ok(workflowService.saveWorkflow(name, description, steps));
    }

    @DeleteMapping("/{name}")
    public Map<String, String> deleteWorkflow(@PathVariable String name) {
        workflowService.deleteWorkflow(name);
        return Map.of("deleted", name);
    }

    @PostMapping("/{name}/run")
    public Map<String, String> runWorkflow(@PathVariable String name, @RequestBody(required = false) Map<String, String> body) {
        String conversationId = body != null ? body.getOrDefault("conversationId", "direct") : "direct";
        String result = workflowService.runWorkflow(name, conversationId);
        return Map.of("result", result);
    }
}
