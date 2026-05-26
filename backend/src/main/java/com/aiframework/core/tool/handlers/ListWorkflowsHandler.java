package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.aiframework.service.workflow.WorkflowService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ListWorkflowsHandler implements ToolHandler {

    private final WorkflowService workflowService;
    private final ObjectMapper objectMapper;

    @Override
    public String handlerName() {
        return "list_workflows";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        try {
            var workflows = workflowService.listWorkflows();
            if (workflows.isEmpty()) {
                return ToolExecutionResult.success("No workflows saved yet.");
            }
            String json = objectMapper.writeValueAsString(workflows);
            return ToolExecutionResult.success(json);
        } catch (JsonProcessingException e) {
            return ToolExecutionResult.error("Failed to serialize workflows: " + e.getMessage());
        }
    }
}
