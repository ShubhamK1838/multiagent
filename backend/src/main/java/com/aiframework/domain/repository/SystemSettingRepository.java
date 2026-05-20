package com.aiframework.domain.repository;

import com.aiframework.domain.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, UUID> {
    Optional<SystemSetting> findBySettingKey(String settingKey);
    List<SystemSetting> findByCategoryOrderBySettingKeyAsc(String category);
}
