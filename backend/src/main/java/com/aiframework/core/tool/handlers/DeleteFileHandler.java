package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.Set;

@Component
public class DeleteFileHandler implements ToolHandler {

    private static final Set<String> PROTECTED_PREFIXES = Set.of(
        "/System", "/Windows", "/usr", "/bin", "/etc", "/boot",
        System.getProperty("user.home") + File.separator + "AppData",
        System.getProperty("user.home") + File.separator + "Library"
    );

    @Override
    public String handlerName() {
        return "delete_file";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String pathStr = (String) args.get("path");
        if (pathStr == null || pathStr.isBlank()) {
            return ToolExecutionResult.error("Parameter 'path' is required");
        }

        try {
            Path path = Paths.get(pathStr).toRealPath();
            String abs = path.toAbsolutePath().toString();

            for (String prefix : PROTECTED_PREFIXES) {
                if (abs.startsWith(prefix)) {
                    return ToolExecutionResult.error("Cannot delete protected path: " + abs);
                }
            }

            if (Files.isDirectory(path)) {
                return ToolExecutionResult.error(
                    "Refusing to delete directory without recursive confirmation. Use a specific file path."
                );
            }

            String name = path.getFileName().toString();
            Files.delete(path);
            return ToolExecutionResult.success("Deleted: " + name);
        } catch (NoSuchFileException e) {
            return ToolExecutionResult.error("File not found: " + pathStr);
        } catch (IOException e) {
            return ToolExecutionResult.error("Delete failed: " + e.getMessage());
        }
    }
}
