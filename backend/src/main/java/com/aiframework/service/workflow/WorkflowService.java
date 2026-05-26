package com.aiframework.service.workflow;

import com.aiframework.core.tool.ToolDispatcher;
import com.aiframework.core.tool.ToolRegistry;
import com.aiframework.domain.entity.Workflow;
import com.aiframework.domain.entity.WorkflowStep;
import com.aiframework.domain.repository.WorkflowRepository;
import com.aiframework.domain.repository.WorkflowStepRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowStepRepository workflowStepRepository;
    private final ToolRegistry toolRegistry;
    // @Lazy breaks the circular: WorkflowService → ToolDispatcher → BuiltinToolExecutionStrategy
    // → ToolHandlerRegistry → RunWorkflowHandler → WorkflowService
    private final ToolDispatcher toolDispatcher;

    public WorkflowService(
            WorkflowRepository workflowRepository,
            WorkflowStepRepository workflowStepRepository,
            ToolRegistry toolRegistry,
            @Lazy ToolDispatcher toolDispatcher) {
        this.workflowRepository = workflowRepository;
        this.workflowStepRepository = workflowStepRepository;
        this.toolRegistry = toolRegistry;
        this.toolDispatcher = toolDispatcher;
    }

    @Transactional
    public Workflow saveWorkflow(String name, String description, List<Map<String, Object>> steps) {
        Workflow workflow = workflowRepository.findByName(name)
                .orElseGet(Workflow::new);

        workflow.setName(name);
        workflow.setDescription(description);
        workflow = workflowRepository.save(workflow);

        // Replace all steps
        workflowStepRepository.deleteByWorkflowId(workflow.getId());
        UUID wfId = workflow.getId();
        for (int i = 0; i < steps.size(); i++) {
            Map<String, Object> step = steps.get(i);
            @SuppressWarnings("unchecked")
            Map<String, Object> toolArgs = step.get("tool_args") instanceof Map<?,?>
                    ? (Map<String, Object>) step.get("tool_args")
                    : Map.of();
            WorkflowStep ws = WorkflowStep.builder()
                    .workflowId(wfId)
                    .stepOrder(i)
                    .toolName((String) step.get("tool_name"))
                    .toolArgs(toolArgs)
                    .build();
            workflowStepRepository.save(ws);
        }
        return workflow;
    }

    public String runWorkflow(String name, String conversationId) {
        Workflow workflow = workflowRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + name));

        List<WorkflowStep> steps = workflowStepRepository.findByWorkflowIdOrderByStepOrderAsc(workflow.getId());
        if (steps.isEmpty()) return "Workflow '" + name + "' has no steps.";

        StringBuilder results = new StringBuilder();
        for (WorkflowStep step : steps) {
            try {
                var tool = toolRegistry.findByName(step.getToolName());
                var result = toolDispatcher.dispatch(tool, step.getToolArgs(), conversationId);
                results.append("Step ").append(step.getStepOrder()).append(" (").append(step.getToolName()).append("): ");
                results.append(result.isSuccess() ? result.getResult() : "ERROR: " + result.getError());
                results.append("\n");
            } catch (Exception e) {
                results.append("Step ").append(step.getStepOrder()).append(" (").append(step.getToolName())
                        .append("): ERROR — ").append(e.getMessage()).append("\n");
            }
        }

        updateRunStats(workflow);
        return results.toString().trim();
    }

    @Transactional
    protected void updateRunStats(Workflow workflow) {
        workflow.setRunCount(workflow.getRunCount() + 1);
        workflow.setLastRunAt(Instant.now());
        workflowRepository.save(workflow);
    }

    public List<WorkflowWithSteps> listWorkflows() {
        return workflowRepository.findAllByOrderByNameAsc().stream()
                .map(wf -> {
                    List<WorkflowStep> steps = workflowStepRepository.findByWorkflowIdOrderByStepOrderAsc(wf.getId());
                    return new WorkflowWithSteps(wf, steps);
                })
                .collect(Collectors.toList());
    }

    public WorkflowWithSteps getWorkflow(String name) {
        Workflow wf = workflowRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + name));
        List<WorkflowStep> steps = workflowStepRepository.findByWorkflowIdOrderByStepOrderAsc(wf.getId());
        return new WorkflowWithSteps(wf, steps);
    }

    @Transactional
    public void deleteWorkflow(String name) {
        workflowRepository.findByName(name).ifPresent(wf -> {
            workflowStepRepository.deleteByWorkflowId(wf.getId());
            workflowRepository.delete(wf);
        });
    }

    public record WorkflowWithSteps(Workflow workflow, List<WorkflowStep> steps) {}
}
