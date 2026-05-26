package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.aiframework.service.workflow.WorkflowService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class RunWorkflowHandler implements ToolHandler {

    // @Lazy breaks the circular: RunWorkflowHandler → WorkflowService → ToolDispatcher
    // → BuiltinToolExecutionStrategy → ToolHandlerRegistry → RunWorkflowHandler
    private final WorkflowService workflowService;

    public RunWorkflowHandler(@Lazy WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @Override
    public String handlerName() {
        return "run_workflow";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String name = (String) args.get("name");
        if (name == null || name.isBlank()) {
            return ToolExecutionResult.error("Workflow name is required.");
        }
        try {
            String result = workflowService.runWorkflow(name, conversationId);
            return ToolExecutionResult.success(result);
        } catch (IllegalArgumentException e) {
            return ToolExecutionResult.error(e.getMessage());
        } catch (Exception e) {
            return ToolExecutionResult.error("Workflow execution failed: " + e.getMessage());
        }
    }
}
