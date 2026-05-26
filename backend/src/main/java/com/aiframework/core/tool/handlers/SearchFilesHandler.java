package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class SearchFilesHandler implements ToolHandler {

    private final ObjectMapper objectMapper;

    @Override
    public String handlerName() {
        return "search_files";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String query = (String) args.get("query");
        String basePath = (String) args.getOrDefault("path", System.getProperty("user.home"));

        if (query == null || query.isBlank()) {
            return ToolExecutionResult.error("Parameter 'query' is required");
        }

        try {
            Path root = Paths.get(basePath);
            String queryLower = query.toLowerCase();

            List<Map<String, Object>> results;
            try (Stream<Path> stream = Files.walk(root, 5)) {
                results = stream
                    .filter(p -> p.getFileName() != null &&
                                 p.getFileName().toString().toLowerCase().contains(queryLower))
                    .limit(50)
                    .map(p -> {
                        Map<String, Object> entry = new LinkedHashMap<>();
                        entry.put("name", p.getFileName().toString());
                        entry.put("path", p.toAbsolutePath().toString());
                        entry.put("type", Files.isDirectory(p) ? "directory" : "file");
                        return entry;
                    })
                    .collect(Collectors.toList());
            }

            return ToolExecutionResult.success(objectMapper.writeValueAsString(results));
        } catch (IOException e) {
            return ToolExecutionResult.error("Search failed: " + e.getMessage());
        }
    }
}
