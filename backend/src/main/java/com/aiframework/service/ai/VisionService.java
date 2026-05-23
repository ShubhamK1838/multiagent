package com.aiframework.service.ai;

import com.aiframework.service.aimodel.ChatClientProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

import java.util.Base64;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisionService {

    private final ChatClientProvider chatClientProvider;

    private static final String SYSTEM_PROMPT = """
        You are J.A.R.V.I.S., analyzing the operator's HUD interface.
        The operator has drawn on the HUD screen. The drawing is attached as an image.
        Operator intent: %s
        Current UI state: %s
        
        Analyze what you see. You MUST respond with a JSON array of annotations.
        Each annotation should point out elements, answer the intent, or label parts of the screen.
        
        Format exactly like this (no markdown fences, just JSON):
        [
          {"x": 150, "y": 200, "text": "This is the terminal", "color": "#00d4ff"},
          {"x": 400, "y": 100, "text": "System load is normal", "color": "#00ff88"}
        ]
        
        Use exact pixel coordinates relative to the image size.
        """;

    public String analyze(String imageBase64, String uiState, String intent) {
        try {
            ChatClient client = chatClientProvider.getDefault();
            
            // Clean base64 (remove data:image/png;base64, prefix if present)
            String base64Data = imageBase64;
            if (base64Data.contains(",")) {
                base64Data = base64Data.split(",")[1];
            }
            
            byte[] imageData = Base64.getDecoder().decode(base64Data);
            
            String prompt = String.format(SYSTEM_PROMPT, intent != null ? intent : "Analyze the screen", uiState);

            return client.prompt()
                    .system(prompt)
                    .user(u -> u.text("Analyze this HUD drawing.")
                                .media(MimeTypeUtils.IMAGE_PNG, new ByteArrayResource(imageData)))
                    .call()
                    .content();
                    
        } catch (Exception e) {
            log.error("Failed to analyze vision", e);
            // Fallback response if vision model fails or is not configured properly
            return "[{\"x\": 100, \"y\": 100, \"text\": \"AI Vision Error: " + e.getMessage() + "\", \"color\": \"#ef4444\"}]";
        }
    }
}
