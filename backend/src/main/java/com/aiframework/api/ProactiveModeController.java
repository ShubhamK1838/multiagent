package com.aiframework.api;

import com.aiframework.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/proactive")
@RequiredArgsConstructor
public class ProactiveModeController {

    private final SettingsService settingsService;

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        boolean enabled = settingsService.getBoolean("proactive.enabled", false);
        String watchPath = settingsService.get("proactive.watch_path", "");
        return Map.of("enabled", enabled, "watchPath", watchPath != null ? watchPath : "");
    }

    @PostMapping("/toggle")
    public Map<String, Object> toggle() {
        boolean current = settingsService.getBoolean("proactive.enabled", false);
        settingsService.set("proactive.enabled", String.valueOf(!current));
        return Map.of("enabled", !current);
    }

    @PutMapping("/watch-path")
    public Map<String, String> setWatchPath(@RequestBody Map<String, String> body) {
        String path = body.getOrDefault("path", "");
        settingsService.set("proactive.watch_path", path);
        return Map.of("watchPath", path);
    }
}
