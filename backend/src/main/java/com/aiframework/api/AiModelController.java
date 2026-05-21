package com.aiframework.api;

import com.aiframework.api.dto.AiModelResponse;
import com.aiframework.domain.entity.AiModel;
import com.aiframework.service.aimodel.AiModelRequest;
import com.aiframework.service.aimodel.AiModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai-models")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiModelController {

    private final AiModelService aiModelService;

    @GetMapping
    public List<AiModelResponse> list() {
        return aiModelService.listAll().stream().map(AiModelResponse::from).toList();
    }

    @GetMapping("/enabled")
    public List<AiModelResponse> listEnabled() {
        return aiModelService.listEnabled().stream().map(AiModelResponse::from).toList();
    }

    @GetMapping("/default")
    public AiModelResponse getDefault() {
        return AiModelResponse.from(aiModelService.getDefault());
    }

    @GetMapping("/{id}")
    public AiModelResponse getById(@PathVariable UUID id) {
        return AiModelResponse.from(aiModelService.getById(id));
    }

    @PostMapping
    public AiModelResponse create(@RequestBody AiModelRequest request) {
        AiModel created = aiModelService.create(request);
        return AiModelResponse.from(created);
    }

    @PutMapping("/{id}")
    public AiModelResponse update(@PathVariable UUID id, @RequestBody AiModelRequest request) {
        AiModel updated = aiModelService.update(id, request);
        return AiModelResponse.from(updated);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        aiModelService.delete(id);
    }

    @PostMapping("/{id}/default")
    public AiModelResponse setDefault(@PathVariable UUID id) {
        AiModel updated = aiModelService.setDefault(id);
        return AiModelResponse.from(updated);
    }
}
