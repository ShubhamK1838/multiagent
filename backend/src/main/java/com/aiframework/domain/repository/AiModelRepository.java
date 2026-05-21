package com.aiframework.domain.repository;

import com.aiframework.domain.entity.AiModel;
import com.aiframework.domain.entity.AiModelProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiModelRepository extends JpaRepository<AiModel, UUID> {

    Optional<AiModel> findByIsDefaultTrue();

    Optional<AiModel> findByName(String name);

    List<AiModel> findByIsEnabledTrueOrderByNameAsc();

    List<AiModel> findByProviderOrderByNameAsc(AiModelProvider provider);

    @Modifying
    @Query("update AiModel m set m.isDefault = false where m.isDefault = true")
    void clearAllDefaults();
}
