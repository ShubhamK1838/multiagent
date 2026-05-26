package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import org.springframework.stereotype.Component;

import java.awt.Desktop;
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.Map;

@Component
public class OpenFileHandler implements ToolHandler {

    @Override
    public String handlerName() {
        return "open_file";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String pathStr = (String) args.get("path");
        if (pathStr == null || pathStr.isBlank()) {
            return ToolExecutionResult.error("Parameter 'path' is required");
        }

        try {
            Path path = Paths.get(pathStr).toRealPath();
            File file = path.toFile();

            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().open(file);
            } else {
                String os = System.getProperty("os.name").toLowerCase();
                ProcessBuilder pb;
                if (os.contains("win")) {
                    pb = new ProcessBuilder("cmd", "/c", "start", "", path.toString());
                } else if (os.contains("mac")) {
                    pb = new ProcessBuilder("open", path.toString());
                } else {
                    pb = new ProcessBuilder("xdg-open", path.toString());
                }
                pb.start();
            }

            return ToolExecutionResult.success("Opened: " + file.getName());
        } catch (NoSuchFileException e) {
            return ToolExecutionResult.error("File not found: " + pathStr);
        } catch (IOException e) {
            return ToolExecutionResult.error("Failed to open file: " + e.getMessage());
        }
    }
}
