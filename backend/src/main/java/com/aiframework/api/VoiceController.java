package com.aiframework.api;

import com.aiframework.service.ai.SpeechSynthesisService;
import com.aiframework.service.ai.TranscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
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
    private final SpeechSynthesisService speechSynthesisService;

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

    /**
     * Synthesise speech for the given text via the neural TTS NIM. Returns raw audio bytes the
     * browser plays directly. On failure the client falls back to browser speech synthesis.
     */
    @PostMapping("/speak")
    public ResponseEntity<byte[]> speak(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (!speechSynthesisService.isNeuralEnabled()) {
            // Neural TTS disabled — signal the client to use its browser fallback.
            return ResponseEntity.status(503).build();
        }
        try {
            byte[] audio = speechSynthesisService.speak(text, body.get("voice"));
            if (audio == null || audio.length == 0) {
                return ResponseEntity.status(502).build();
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(speechSynthesisService.audioMimeType()))
                    .body(audio);
        } catch (Exception e) {
            log.error("Speech synthesis failed", e);
            return ResponseEntity.status(502).build();
        }
    }
}
