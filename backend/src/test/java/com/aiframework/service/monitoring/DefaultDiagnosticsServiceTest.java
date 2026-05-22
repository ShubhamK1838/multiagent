package com.aiframework.service.monitoring;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

public class DefaultDiagnosticsServiceTest {

    @Test
    public void testGetSystemHealth() {
        DefaultDiagnosticsService service = new DefaultDiagnosticsService();
        Map<String, Object> health = service.getSystemHealth();

        assertNotNull(health);
        assertEquals("ONLINE", health.get("status"));
        assertTrue(health.containsKey("systemLoadAverage"));
        assertTrue(health.containsKey("availableProcessors"));
        assertTrue(health.containsKey("freeMemoryMB"));
        assertTrue(health.containsKey("totalMemoryMB"));
        assertTrue(health.containsKey("memoryUsagePercent"));
    }
}
