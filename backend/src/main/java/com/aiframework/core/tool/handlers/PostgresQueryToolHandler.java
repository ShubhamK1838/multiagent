package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PostgresQueryToolHandler implements ToolHandler {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public String handlerName() {
        return "postgres_query";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String query = (String) args.get("query");
        if (query == null || query.isBlank()) {
            return ToolExecutionResult.error("Query parameter is missing or empty.");
        }

        if (!query.trim().toUpperCase().startsWith("SELECT") && !query.trim().toUpperCase().startsWith("EXPLAIN")) {
            return ToolExecutionResult.error("Only SELECT and EXPLAIN queries are allowed.");
        }

        try {
            List<Map<String, Object>> results = jdbcTemplate.queryForList(query);
            String jsonResult = objectMapper.writeValueAsString(results);
            return ToolExecutionResult.success(jsonResult);
        } catch (Exception e) {
            log.error("Failed to execute postgres query: {}", query, e);
            return ToolExecutionResult.error("Database query failed: " + e.getMessage()+" cause: "+e.getCause());
        }
    }
}
