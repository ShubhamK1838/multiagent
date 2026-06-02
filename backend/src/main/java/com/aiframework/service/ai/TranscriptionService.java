package com.aiframework.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

/**
 * Transcribes speech via a locally hosted NVIDIA Whisper NIM, which exposes the
 * OpenAI-compatible {@code POST /v1/audio/transcriptions} endpoint. Audio is
 * forwarded as multipart form-data exactly like the OpenAI / NIM curl example.
 */
@Slf4j
@Service
public class TranscriptionService {

    private final WebClient webClient;
    private final String language;

    public TranscriptionService(
            WebClient.Builder webClientBuilder,
            @Value("${voice.asr.base-url}") String baseUrl,
            @Value("${voice.asr.language:en-US}") String language,
            @Value("${voice.asr.api-key:}") String apiKey) {
        this.language = language;
        WebClient.Builder builder = webClientBuilder.baseUrl(baseUrl);
        if (StringUtils.hasText(apiKey)) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
        }
        this.webClient = builder.build();
    }

    /**
     * @param audio        raw audio bytes (WAV/OPUS/FLAC, mono 16-bit)
     * @param filename     original filename, used to hint the codec to the NIM
     * @param contentType  MIME type of the audio (e.g. audio/wav)
     * @return the recognized transcript text (empty string if nothing was recognized)
     */
    public String transcribe(byte[] audio, String filename, String contentType) {
        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("file", new ByteArrayResource(audio) {
            @Override
            public String getFilename() {
                return StringUtils.hasText(filename) ? filename : "audio.wav";
            }
        }).contentType(resolveContentType(contentType));
        body.part("language", language);

        JsonNode response = webClient.post()
                .uri("/v1/audio/transcriptions")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(body.build()))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofSeconds(60))
                .block();

        if (response == null) {
            return "";
        }
        // OpenAI-compatible NIM returns {"text": "..."}; tolerate alternative shapes.
        JsonNode text = response.has("text") ? response.get("text") : response.path("transcript");
        return text.asText("").trim();
    }

    private MediaType resolveContentType(String contentType) {
        try {
            return StringUtils.hasText(contentType)
                    ? MediaType.parseMediaType(contentType)
                    : MediaType.parseMediaType("audio/wav");
        } catch (Exception e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
