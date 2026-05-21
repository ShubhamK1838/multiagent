package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import org.springframework.stereotype.Component;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import java.util.Map;

@Component
public class CalculatorHandler implements ToolHandler {

    @Override
    public String handlerName() {
        return "calculator";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String expression = (String) args.get("expression");
        try {
            ScriptEngineManager manager = new ScriptEngineManager();
            ScriptEngine engine = manager.getEngineByName("JavaScript");
            if (engine == null) {
                return ToolExecutionResult.error("Script engine unavailable");
            }
            Object result = engine.eval(expression.replaceAll("[^0-9+\\-*/().,% ]", ""));
            return ToolExecutionResult.success(String.valueOf(result));
        } catch (Exception e) {
            return ToolExecutionResult.error("Evaluation failed: " + e.getMessage());
        }
    }
}
