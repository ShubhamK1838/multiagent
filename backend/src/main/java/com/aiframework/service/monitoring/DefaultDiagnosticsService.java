package com.aiframework.service.monitoring;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@Service
public class DefaultDiagnosticsService implements DiagnosticsService {

    private final DataSource dataSource;

    @Value("${spring.ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    public DefaultDiagnosticsService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

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

        checkPostgresStatus(health);
        checkOllamaStatus(health);

        return health;
    }

    private void checkPostgresStatus(Map<String, Object> health) {
        long startTime = System.currentTimeMillis();
        try (Connection conn = dataSource.getConnection()) {
            boolean isValid = conn.isValid(2);
            long latency = System.currentTimeMillis() - startTime;
            health.put("postgresStatus", isValid ? "ONLINE" : "OFFLINE");
            health.put("postgresLatencyMs", latency);
        } catch (Exception e) {
            health.put("postgresStatus", "ERROR");
            health.put("postgresError", e.getMessage());
        }
    }

    private void checkOllamaStatus(Map<String, Object> health) {
        long startTime = System.currentTimeMillis();
        try {
            URL url = new URL(ollamaBaseUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(2000);
            connection.setReadTimeout(2000);

            int responseCode = connection.getResponseCode();
            long latency = System.currentTimeMillis() - startTime;

            if (responseCode == 200) {
                health.put("ollamaStatus", "ONLINE");
                health.put("ollamaLatencyMs", latency);
            } else {
                health.put("ollamaStatus", "OFFLINE");
                health.put("ollamaError", "HTTP " + responseCode);
            }
        } catch (Exception e) {
            health.put("ollamaStatus", "ERROR");
            health.put("ollamaError", e.getMessage());
        }
    }
}
