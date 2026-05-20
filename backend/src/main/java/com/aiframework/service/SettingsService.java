package com.aiframework.service;

import com.aiframework.domain.entity.SystemSetting;
import com.aiframework.domain.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SystemSettingRepository repository;

    public String get(String key, String defaultValue) {
        return repository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    public int getInt(String key, int defaultValue) {
        try {
            return Integer.parseInt(get(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public boolean getBoolean(String key, boolean defaultValue) {
        return Boolean.parseBoolean(get(key, String.valueOf(defaultValue)));
    }

    public double getDouble(String key, double defaultValue) {
        try {
            return Double.parseDouble(get(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public void set(String key, String value) {
        SystemSetting setting = repository.findBySettingKey(key)
                .orElse(SystemSetting.builder()
                        .settingKey(key)
                        .settingType("STRING")
                        .category("GENERAL")
                        .build());
        setting.setSettingValue(value);
        repository.save(setting);
    }

    public List<SystemSetting> getByCategory(String category) {
        return repository.findByCategoryOrderBySettingKeyAsc(category);
    }

    public List<SystemSetting> getAll() {
        return repository.findAll();
    }

    public Map<String, String> getAllAsMap() {
        return repository.findAll().stream()
                .collect(Collectors.toMap(SystemSetting::getSettingKey, s ->
                        s.isSecret() ? "***" : String.valueOf(s.getSettingValue())));
    }
}
