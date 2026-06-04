package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Executes a short Python or Node snippet in a throwaway temp file with a hard timeout and a
 * capped output. Real code execution, so the tool is registered {@code requires_confirmation=true}
 * — every run is explicitly approved by the user before it happens.
 */
@Slf4j
@Component
public class RunCodeHandler implements ToolHandler {

    private static final int TIMEOUT_SECONDS = 15;
    private static final int MAX_OUTPUT_LINES = 300;

    @Override
    public String handlerName() {
        return "run_code";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String code = (String) args.get("code");
        if (code == null || code.isBlank()) {
            return ToolExecutionResult.error("Parameter 'code' is required");
        }
        String language = String.valueOf(args.getOrDefault("language", "python")).toLowerCase().trim();

        Lang lang = switch (language) {
            case "python", "py" -> new Lang(".py", resolvePython());
            case "node", "js", "javascript" -> new Lang(".js", "node");
            default -> null;
        };
        if (lang == null) {
            return ToolExecutionResult.error("Unsupported language '" + language + "'. Use 'python' or 'node'.");
        }

        Path file = null;
        try {
            file = Files.createTempFile("jarvis_run_", lang.extension());
            Files.writeString(file, code);

            ProcessBuilder pb = new ProcessBuilder(lang.interpreter(), file.toString());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return ToolExecutionResult.error("Execution timed out after " + TIMEOUT_SECONDS + " seconds");
            }

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                int lines = 0;
                while ((line = reader.readLine()) != null && lines++ < MAX_OUTPUT_LINES) {
                    output.append(line).append('\n');
                }
                if (lines >= MAX_OUTPUT_LINES) output.append("… (output truncated)\n");
            }

            int exit = process.exitValue();
            String body = output.toString().trim();
            if (exit != 0) {
                return ToolExecutionResult.success("Exited with code " + exit + ":\n" + body);
            }
            return ToolExecutionResult.success(body.isEmpty() ? "(no output)" : body);
        } catch (Exception e) {
            Thread.currentThread().interrupt();
            return ToolExecutionResult.error("Execution failed: " + e.getMessage());
        } finally {
            if (file != null) {
                try { Files.deleteIfExists(file); } catch (Exception ignored) { /* best effort */ }
            }
        }
    }

    /** Prefer 'python3' where available, falling back to 'python' (Windows). */
    private String resolvePython() {
        for (String candidate : List.of("python3", "python")) {
            try {
                Process p = new ProcessBuilder(candidate, "--version").redirectErrorStream(true).start();
                if (p.waitFor(3, TimeUnit.SECONDS) && p.exitValue() == 0) return candidate;
            } catch (Exception ignored) { /* try next */ }
        }
        return "python";
    }

    private record Lang(String extension, String interpreter) {}
}
