package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;

@Component
@RequiredArgsConstructor
public class ListFilesHandler implements ToolHandler {

    private final ObjectMapper objectMapper;

    @Override
    public String handlerName() {
        return "list_files";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String pathStr = (String) args.getOrDefault("path", System.getProperty("user.home"));

        try {
            Path path = Paths.get(pathStr).toRealPath();
            if (!Files.isDirectory(path)) {
                return ToolExecutionResult.error("Not a directory: " + pathStr);
            }

            List<Map<String, Object>> files = new ArrayList<>();
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(path)) {
                for (Path entry : stream) {
                    BasicFileAttributes attrs = Files.readAttributes(entry, BasicFileAttributes.class);
                    Map<String, Object> info = new LinkedHashMap<>();
                    info.put("name", entry.getFileName().toString());
                    info.put("path", entry.toString());
                    info.put("type", attrs.isDirectory() ? "directory" : "file");
                    if (!attrs.isDirectory()) info.put("size", attrs.size());
                    info.put("lastModified", attrs.lastModifiedTime().toString());
                    files.add(info);
                }
            }

            files.sort(Comparator.comparing(f -> (String) f.get("name")));
            return ToolExecutionResult.success(objectMapper.writeValueAsString(files));
        } catch (NoSuchFileException e) {
            return ToolExecutionResult.error("Path not found: " + pathStr);
        } catch (IOException e) {
            return ToolExecutionResult.error("Failed to list files: " + e.getMessage());
        }
    }
}
