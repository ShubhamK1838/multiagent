package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.aiframework.service.workflow.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SaveWorkflowHandler implements ToolHandler {

    private final WorkflowService workflowService;

    @Override
    public String handlerName() {
        return "save_workflow";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String name = (String) args.get("name");
        String description = (String) args.getOrDefault("description", "");
        if (name == null || name.isBlank()) {
            return ToolExecutionResult.error("Workflow name is required.");
        }

        Object rawSteps = args.get("steps");
        if (!(rawSteps instanceof List<?>)) {
            return ToolExecutionResult.error("Workflow steps must be a list.");
        }
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> steps = (List<Map<String, Object>>) rawSteps;

        try {
            workflowService.saveWorkflow(name, description, steps);
            return ToolExecutionResult.success("Workflow '" + name + "' saved with " + steps.size() + " step(s).");
        } catch (Exception e) {
            return ToolExecutionResult.error("Failed to save workflow: " + e.getMessage());
        }
    }
}
