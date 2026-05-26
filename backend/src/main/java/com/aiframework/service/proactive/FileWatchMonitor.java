package com.aiframework.service.proactive;

import com.aiframework.service.SettingsService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class FileWatchMonitor {

    private final ProactiveAlertPublisher alertPublisher;
    private final SettingsService settingsService;

    private volatile boolean running = false;
    private WatchService watchService;
    private Thread watchThread;

    @PostConstruct
    public void start() {
        watchThread = new Thread(this::watchLoop, "file-watch-monitor");
        watchThread.setDaemon(true);
        watchThread.start();
    }

    @PreDestroy
    public void stop() {
        running = false;
        if (watchService != null) {
            try { watchService.close(); } catch (IOException ignored) {}
        }
    }

    private void watchLoop() {
        running = true;
        while (running) {
            if (!settingsService.getBoolean("proactive.enabled", false)) {
                sleepQuietly(5_000);
                continue;
            }

            try {
                runWatch();
            } catch (Exception e) {
                if (running) {
                    log.warn("FileWatchMonitor error, will restart in 10s: {}", e.getMessage());
                    sleepQuietly(10_000);
                }
            }
        }
    }

    private void runWatch() throws IOException, InterruptedException {
        Path watchPath = resolveWatchPath();
        if (watchPath == null || !Files.isDirectory(watchPath)) {
            sleepQuietly(10_000);
            return;
        }

        log.info("FileWatchMonitor watching: {}", watchPath);
        watchService = FileSystems.getDefault().newWatchService();
        // Single-level watch only — no recursion, avoids Windows event storms
        watchPath.register(watchService, StandardWatchEventKinds.ENTRY_CREATE, StandardWatchEventKinds.ENTRY_MODIFY);

        while (running) {
            WatchKey key = watchService.poll(java.util.concurrent.TimeUnit.SECONDS.toMillis(5),
                    java.util.concurrent.TimeUnit.MILLISECONDS);
            if (key == null) {
                // Re-check settings in case proactive was disabled
                if (!settingsService.getBoolean("proactive.enabled", false)) break;
                continue;
            }

            for (WatchEvent<?> event : key.pollEvents()) {
                WatchEvent.Kind<?> kind = event.kind();
                if (kind == StandardWatchEventKinds.OVERFLOW) continue;

                @SuppressWarnings("unchecked")
                WatchEvent<Path> pathEvent = (WatchEvent<Path>) event;
                String fileName = pathEvent.context().getFileName().toString();
                String action = kind == StandardWatchEventKinds.ENTRY_CREATE ? "created" : "modified";

                alertPublisher.publish("file_" + action,
                        String.format("📁 File %s: `%s` in `%s`", action, fileName, watchPath));
            }

            if (!key.reset()) break;
        }

        watchService.close();
    }

    private Path resolveWatchPath() {
        String configured = settingsService.get("proactive.watch_path", "");
        if (configured != null && !configured.isBlank()) {
            return Path.of(configured);
        }
        String home = System.getProperty("user.home");
        return home != null ? Path.of(home) : null;
    }

    private void sleepQuietly(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
