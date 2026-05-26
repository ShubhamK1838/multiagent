package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetFileMetadataHandler implements ToolHandler {

    private final ObjectMapper objectMapper;

    @Override
    public String handlerName() {
        return "get_file_metadata";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String pathStr = (String) args.get("path");
        if (pathStr == null || pathStr.isBlank()) {
            return ToolExecutionResult.error("Parameter 'path' is required");
        }

        try {
            Path path = Paths.get(pathStr).toRealPath();
            BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);

            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("name", path.getFileName().toString());
            metadata.put("absolutePath", path.toAbsolutePath().toString());
            metadata.put("type", attrs.isDirectory() ? "directory" : "file");
            metadata.put("sizeByes", attrs.size());
            metadata.put("created", attrs.creationTime().toString());
            metadata.put("lastModified", attrs.lastModifiedTime().toString());
            metadata.put("lastAccessed", attrs.lastAccessTime().toString());
            metadata.put("isReadable", Files.isReadable(path));
            metadata.put("isWritable", Files.isWritable(path));
            metadata.put("extension", getExtension(path.getFileName().toString()));

            return ToolExecutionResult.success(objectMapper.writeValueAsString(metadata));
        } catch (NoSuchFileException e) {
            return ToolExecutionResult.error("File not found: " + pathStr);
        } catch (IOException e) {
            return ToolExecutionResult.error("Failed to read metadata: " + e.getMessage());
        }
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(dot + 1) : "";
    }
}
