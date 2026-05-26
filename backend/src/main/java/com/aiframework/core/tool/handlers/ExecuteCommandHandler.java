package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Component
public class ExecuteCommandHandler implements ToolHandler {

    private static final Set<String> ALLOWED_COMMANDS = Set.of(
        "ls", "dir", "pwd", "echo", "date", "time", "whoami",
        "ping", "ipconfig", "ifconfig", "cat", "type",
        "grep", "find", "wc", "sort", "head", "tail",
        "hostname", "uname", "df", "du"
    );

    @Override
    public String handlerName() {
        return "execute_command";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String cmd = (String) args.get("cmd");
        if (cmd == null || cmd.isBlank()) {
            return ToolExecutionResult.error("Parameter 'cmd' is required");
        }

        String baseCommand = cmd.trim().split("\\s+")[0].toLowerCase();
        if (!ALLOWED_COMMANDS.contains(baseCommand)) {
            return ToolExecutionResult.error(
                "Command '" + baseCommand + "' is not permitted. Allowed commands: " +
                String.join(", ", ALLOWED_COMMANDS)
            );
        }

        try {
            String os = System.getProperty("os.name").toLowerCase();
            ProcessBuilder pb = os.contains("win")
                ? new ProcessBuilder("cmd", "/c", cmd)
                : new ProcessBuilder("sh", "-c", cmd);
            pb.redirectErrorStream(true);

            Process process = pb.start();
            boolean finished = process.waitFor(10, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return ToolExecutionResult.error("Command timed out after 10 seconds");
            }

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                int lines = 0;
                while ((line = reader.readLine()) != null && lines++ < 200) {
                    output.append(line).append('\n');
                }
            }

            return ToolExecutionResult.success(output.toString().trim());
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            return ToolExecutionResult.error("Execution failed: " + e.getMessage());
        }
    }
}
