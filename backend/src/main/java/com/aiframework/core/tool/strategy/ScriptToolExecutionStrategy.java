package com.aiframework.core.tool.strategy;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.domain.entity.ToolDefinitionEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Component
public class ScriptToolExecutionStrategy implements ToolExecutionStrategy {

    @Override
    public String toolType() { return "SCRIPT"; }

    @Override
    public ToolExecutionResult execute(ToolDefinitionEntity tool, Map<String, Object> args, String conversationId) {
        String script = (String) tool.getHandlerConfig().get("script");
        if (script == null || script.isBlank()) {
            return ToolExecutionResult.error("SCRIPT tool missing 'script' in handlerConfig");
        }
        // Interpolate args into script using {{key}} placeholders
        for (Map.Entry<String, Object> entry : args.entrySet()) {
            script = script.replace("{{" + entry.getKey() + "}}", String.valueOf(entry.getValue()));
        }
        try {
            ProcessBuilder pb = new ProcessBuilder("sh", "-c", script);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            boolean finished = process.waitFor(30, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return ToolExecutionResult.error("Script timed out after 30 seconds");
            }
            String output;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                output = reader.lines().collect(Collectors.joining("\n"));
            }
            if (process.exitValue() != 0) {
                return ToolExecutionResult.error("Script exited with code " + process.exitValue() + ": " + output);
            }
            return ToolExecutionResult.success(output.isBlank() ? "(no output)" : output);
        } catch (Exception e) {
            log.error("Script execution failed", e);
            return ToolExecutionResult.error("Script execution error: " + e.getMessage());
        }
    }
}
