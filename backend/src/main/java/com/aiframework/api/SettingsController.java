package com.aiframework.api;

import com.aiframework.domain.entity.SystemSetting;
import com.aiframework.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.aiframework.service.ThemeGenerationService;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SettingsController {

    private final SettingsService settingsService;
    private final ThemeGenerationService themeGenerationService;

    @GetMapping
    public List<SystemSetting> getAll() {
        return settingsService.getAll();
    }

    @PostMapping("/generate-theme")
    public Map<String, String> generateTheme(@RequestBody Map<String, String> body) {
        return themeGenerationService.generateTheme(body.get("prompt"));
    }

    @GetMapping("/category/{category}")
    public List<SystemSetting> getByCategory(@PathVariable String category) {
        return settingsService.getByCategory(category);
    }

    @PutMapping("/{key}")
    public Map<String, String> updateSetting(@PathVariable String key, @RequestBody Map<String, String> body) {
        settingsService.set(key, body.get("value"));
        return Map.of("key", key, "value", body.get("value"));
    }

    @PutMapping("/bulk")
    public Map<String, String> bulkUpdate(@RequestBody Map<String, String> settings) {
        settings.forEach(settingsService::set);
        return Map.of("updated", String.valueOf(settings.size()));
    }
}
