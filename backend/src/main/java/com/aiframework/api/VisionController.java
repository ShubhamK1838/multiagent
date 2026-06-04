package com.aiframework.api;

import com.aiframework.api.dto.VisionRequest;
import com.aiframework.service.ai.VisionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class VisionController {

    private final VisionService visionService;

    @PostMapping("/vision")
    public ResponseEntity<String> analyzeVision(@RequestBody VisionRequest request) {
        String jsonResponse = visionService.analyze(request.getImageBase64(), request.getUiState(), request.getIntent());
        return ResponseEntity.ok(jsonResponse);
    }
}
