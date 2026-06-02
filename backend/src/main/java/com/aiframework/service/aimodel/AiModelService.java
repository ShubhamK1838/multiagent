package com.aiframework.service.aimodel;

import com.aiframework.domain.entity.AiModel;
import com.aiframework.domain.entity.AiModelProvider;
import com.aiframework.domain.repository.AiModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiModelService {

    private final AiModelRepository repository;
    private final AiModelValidator validator;
    private final ApplicationEventPublisher events;

    public List<AiModel> listAll() {
        return repository.findAll();
    }

    public List<AiModel> listEnabled() {
        return repository.findByIsEnabledTrueOrderByNameAsc();
    }

    public AiModel getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new AiModelNotFoundException("AI model not found: " + id));
    }

    public AiModel getDefault() {
        return repository.findByIsDefaultTrue()
                .orElseThrow(() -> new AiModelNotFoundException(
                        "No default AI model configured. Create one and mark it as default."));
    }

    @Transactional
    public AiModel create(AiModelRequest request) {
        validator.validateForCreate(request);
        AiModel model = buildEntity(request);
        AiModel saved = repository.save(model);
        events.publishEvent(AiModelChangedEvent.updated(saved.getId()));
        return saved;
    }

    @Transactional
    public AiModel update(UUID id, AiModelRequest request) {
        validator.validateForUpdate(request);
        AiModel existing = getById(id);
        applyUpdates(existing, request);
        AiModel saved = repository.save(existing);
        events.publishEvent(AiModelChangedEvent.updated(saved.getId()));
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        AiModel existing = getById(id);
        if (existing.isDefault()) {
            throw new InvalidAiModelException(
                    "Cannot delete the default model. Promote another model first.");
        }
        repository.delete(existing);
        events.publishEvent(AiModelChangedEvent.deleted(id));
    }

    @Transactional
    public AiModel setDefault(UUID id) {
        AiModel target = getById(id);
        if (!target.isEnabled()) {
            throw new InvalidAiModelException("Cannot mark a disabled model as default");
        }
        repository.clearAllDefaults();
        repository.flush();
        target.setDefault(true);
        AiModel saved = repository.save(target);
        events.publishEvent(AiModelChangedEvent.defaultChanged(saved.getId()));
        return saved;
    }

    private AiModel buildEntity(AiModelRequest request) {
        return AiModel.builder()
                .name(request.getName())
                .provider(request.getProvider())
                .modelId(request.getModelId())
                .baseUrl(request.getBaseUrl())
                .apiKey(request.getApiKey())
                .awsRegion(request.getAwsRegion())
                .temperature(defaultIfNull(request.getTemperature(), new BigDecimal("0.70")))
                .maxTokens(defaultIfNull(request.getMaxTokens(), 4096))
                .isDefault(false)
                .isEnabled(defaultIfNull(request.getIsEnabled(), Boolean.TRUE))
                .options(request.getOptions() == null ? new HashMap<>() : request.getOptions())
                .description(request.getDescription())
                .build();
    }

    private void applyUpdates(AiModel existing, AiModelRequest request) {
        if (request.getName() != null)        existing.setName(request.getName());
        if (request.getProvider() != null)    existing.setProvider(request.getProvider());
        if (request.getModelId() != null)     existing.setModelId(request.getModelId());
        if (request.getBaseUrl() != null)     existing.setBaseUrl(request.getBaseUrl());
        if (request.getApiKey() != null)      existing.setApiKey(request.getApiKey());
        if (request.getAwsRegion() != null)   existing.setAwsRegion(request.getAwsRegion());
        if (request.getTemperature() != null) existing.setTemperature(request.getTemperature());
        if (request.getMaxTokens() != null)   existing.setMaxTokens(request.getMaxTokens());
        if (request.getIsEnabled() != null)   existing.setEnabled(request.getIsEnabled());
        if (request.getOptions() != null)     existing.setOptions(request.getOptions());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
    }

    private static <T> T defaultIfNull(T value, T fallback) {
        return value != null ? value : fallback;
    }
}
