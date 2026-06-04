package com.aiframework.service.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Synthesises speech via a neural TTS NIM, mirroring {@link TranscriptionService}. Targets the
 * OpenAI-compatible {@code POST /v1/audio/speech} contract ({@code {model, input, voice,
 * response_format}} → raw audio bytes), which NVIDIA Riva / OpenAI-compatible NIMs expose.
 *
 * <p>The endpoint path, model, and voice are configurable so the same service works across NIM
 * images. Callers should fail soft (the frontend falls back to browser speech) if synthesis throws.
 */
@Slf4j
@Service
public class SpeechSynthesisService {

    private final WebClient webClient;
    private final String engine;
    private final String path;
    private final String model;
    private final String defaultVoice;
    private final String format;

    public SpeechSynthesisService(
            WebClient.Builder webClientBuilder,
            @Value("${voice.tts.engine:nvidia}") String engine,
            @Value("${voice.tts.base-url:http://localhost:9001}") String baseUrl,
            @Value("${voice.tts.path:/v1/audio/speech}") String path,
            @Value("${voice.tts.model:magpie-tts-multilingual}") String model,
            @Value("${voice.tts.nim-voice:English-US.Male-1}") String defaultVoice,
            @Value("${voice.tts.format:mp3}") String format,
            @Value("${voice.tts.api-key:}") String apiKey) {
        this.engine = engine;
        this.path = path;
        this.model = model;
        this.defaultVoice = defaultVoice;
        this.format = format;
        WebClient.Builder builder = webClientBuilder.baseUrl(baseUrl);
        if (StringUtils.hasText(apiKey)) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
        }
        this.webClient = builder.build();
    }

    /** True when neural TTS is configured; otherwise the client should use browser speech. */
    public boolean isNeuralEnabled() {
        return "nvidia".equalsIgnoreCase(engine);
    }

    public String audioMimeType() {
        return "wav".equalsIgnoreCase(format) ? "audio/wav" : "audio/mpeg";
    }

    /**
     * @param text  text to speak
     * @param voice optional voice override; falls back to the configured default
     * @return raw audio bytes in the configured format
     */
    public byte[] speak(String text, String voice) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("input", text);
        body.put("voice", StringUtils.hasText(voice) ? voice : defaultVoice);
        body.put("response_format", format);

        return webClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(byte[].class)
                .timeout(Duration.ofSeconds(30))
                .block();
    }
}
