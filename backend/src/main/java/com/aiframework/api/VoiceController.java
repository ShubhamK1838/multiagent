package com.aiframework.api;

import com.aiframework.service.ai.TranscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/voice")
@RequiredArgsConstructor
public class VoiceController {

    private final TranscriptionService transcriptionService;

    /**
     * Transcribe recorded microphone audio via the NVIDIA Whisper NIM.
     * Accepts a multipart upload under the field name {@code file}.
     */
    @PostMapping("/transcribe")
    public ResponseEntity<Map<String, String>> transcribe(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No audio supplied"));
        }
        try {
            String text = transcriptionService.transcribe(
                    file.getBytes(),
                    file.getOriginalFilename(),
                    file.getContentType());
            return ResponseEntity.ok(Map.of("text", text));
        } catch (IOException e) {
            log.error("Failed to read uploaded audio", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Could not read audio"));
        } catch (Exception e) {
            log.error("Transcription failed", e);
            return ResponseEntity.status(502).body(Map.of("error", "Transcription service unavailable: " + e.getMessage()));
        }
    }
}
