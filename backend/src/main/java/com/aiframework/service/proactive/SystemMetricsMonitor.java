package com.aiframework.service.proactive;

import com.aiframework.service.SettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;

@Slf4j
@Component
@RequiredArgsConstructor
public class SystemMetricsMonitor {

    private final ProactiveAlertPublisher alertPublisher;
    private final SettingsService settingsService;

    @Scheduled(fixedDelay = 30_000)
    public void checkMetrics() {
        if (!settingsService.getBoolean("proactive.enabled", false)) return;
        checkJvmMemory();
    }

    private void checkJvmMemory() {
        MemoryMXBean memory = ManagementFactory.getMemoryMXBean();
        long used = memory.getHeapMemoryUsage().getUsed();
        long max = memory.getHeapMemoryUsage().getMax();
        if (max <= 0) return;

        int usedPercent = (int) (used * 100L / max);
        int threshold = settingsService.getInt("proactive.memory_threshold", 85);

        if (usedPercent >= threshold) {
            alertPublisher.publish("jvm_memory",
                    String.format("Heap memory's running warm — %d%% (%s of %s). Might be worth clearing some caches.",
                            usedPercent, formatBytes(used), formatBytes(max)));
        }
    }

    private String formatBytes(long bytes) {
        if (bytes >= 1024 * 1024 * 1024) return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
        if (bytes >= 1024 * 1024) return String.format("%.0f MB", bytes / (1024.0 * 1024));
        return bytes + " B";
    }
}
