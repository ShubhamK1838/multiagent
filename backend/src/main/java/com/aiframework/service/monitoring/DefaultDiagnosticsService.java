package com.aiframework.service.monitoring;

import org.springframework.stereotype.Service;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.util.HashMap;
import java.util.Map;

@Service
public class DefaultDiagnosticsService implements DiagnosticsService {
    @Override
    public Map<String, Object> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();

        health.put("status", "ONLINE");
        health.put("systemLoadAverage", osBean.getSystemLoadAverage());
        health.put("availableProcessors", osBean.getAvailableProcessors());

        long freeMemory = Runtime.getRuntime().freeMemory();
        long totalMemory = Runtime.getRuntime().totalMemory();
        health.put("freeMemoryMB", freeMemory / (1024 * 1024));
        health.put("totalMemoryMB", totalMemory / (1024 * 1024));
        health.put("memoryUsagePercent", ((double)(totalMemory - freeMemory) / totalMemory) * 100);

        return health;
    }
}
