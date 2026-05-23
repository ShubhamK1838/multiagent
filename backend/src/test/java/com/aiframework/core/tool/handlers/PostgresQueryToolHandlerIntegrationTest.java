package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.UUID;

@SpringBootTest
public class PostgresQueryToolHandlerIntegrationTest {

    @Autowired
    private PostgresQueryToolHandler postgresQueryToolHandler;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @Disabled("Requires PostgreSQL testcontainer")
    public void testExecuteValidSelectQuery() {
        // Prepare some data using JdbcTemplate to ensure the real DB is accessible
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS test_postgres_tool (id INT, val VARCHAR(50))");
        jdbcTemplate.execute("TRUNCATE TABLE test_postgres_tool");
        jdbcTemplate.execute("INSERT INTO test_postgres_tool (id, val) VALUES (1, 'hello_real_db')");

        // Execute the tool
        String query = "SELECT id, val FROM test_postgres_tool WHERE id = 1";
        Map<String, Object> args = Map.of("query", query);
        String conversationId = UUID.randomUUID().toString();

        ToolExecutionResult result = postgresQueryToolHandler.execute(args, conversationId);

        // Verify the result
        Assertions.assertTrue(result.isSuccess(), "Tool execution should be successful");
        Assertions.assertNotNull(result.getResult(), "Result JSON should not be null");
        
        // Assert the JSON contains the expected data
        Assertions.assertTrue(result.getResult().contains("\"ID\":1") || result.getResult().contains("\"id\":1"), "Result should contain id 1");
        Assertions.assertTrue(result.getResult().contains("\"VAL\":\"hello_real_db\"") || result.getResult().contains("\"val\":\"hello_real_db\""), "Result should contain the correct string value");

        // Clean up
        jdbcTemplate.execute("DROP TABLE test_postgres_tool");
    }

    @Test
    @Disabled("Requires PostgreSQL testcontainer")
    public void testExecuteDisallowedQuery() {
        // Test that the security constraint works
        String query = "DROP TABLE system_settings";
        Map<String, Object> args = Map.of("query", query);
        String conversationId = UUID.randomUUID().toString();

        ToolExecutionResult result = postgresQueryToolHandler.execute(args, conversationId);

        // Verify it blocked the destructive query
        Assertions.assertFalse(result.isSuccess(), "Tool execution should fail for non-SELECT queries");
        Assertions.assertTrue(result.getError().contains("Only SELECT and EXPLAIN queries are allowed"), "Error should mention safety constraint");
    }

    @Test
    @Disabled("Requires PostgreSQL testcontainer")
    public void testExecuteInvalidSyntax() {
        // Test query with syntax error
        String query = "SELECT * FROM non_existent_table_xyz_123";
        Map<String, Object> args = Map.of("query", query);
        String conversationId = UUID.randomUUID().toString();

        ToolExecutionResult result = postgresQueryToolHandler.execute(args, conversationId);

        // Verify it handles SQL exceptions properly without crashing
        Assertions.assertFalse(result.isSuccess(), "Tool execution should fail due to syntax error");
        Assertions.assertTrue(result.getError().contains("Database query failed:"), "Error should bubble up the database exception");
    }
}
