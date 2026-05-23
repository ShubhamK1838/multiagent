package com.aiframework.service.monitoring;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;

public class DefaultDiagnosticsServiceTest {

    @Test
    public void testGetSystemHealth() throws SQLException {
        DataSource dataSource = Mockito.mock(DataSource.class);
        Connection connection = Mockito.mock(Connection.class);
        Mockito.when(dataSource.getConnection()).thenReturn(connection);
        Mockito.when(connection.isValid(anyInt())).thenReturn(true);

        DefaultDiagnosticsService service = new DefaultDiagnosticsService(dataSource);
        Map<String, Object> health = service.getSystemHealth();

        assertNotNull(health);
        assertEquals("ONLINE", health.get("status"));
        assertTrue(health.containsKey("systemLoadAverage"));
        assertTrue(health.containsKey("availableProcessors"));
        assertTrue(health.containsKey("freeMemoryMB"));
        assertTrue(health.containsKey("totalMemoryMB"));
        assertTrue(health.containsKey("memoryUsagePercent"));
        assertTrue(health.containsKey("postgresStatus"));
        assertTrue(health.containsKey("ollamaStatus"));
    }
}
