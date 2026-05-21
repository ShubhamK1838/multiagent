package com.aiframework.service;

import com.aiframework.service.aimodel.ChatClientProvider;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ThemeGenerationService {

    private final ChatClientProvider chatClientProvider;
    private final SettingsService settingsService;
    private final ObjectMapper objectMapper;

    private static final String THEME_GENERATION_PROMPT = """
            You are a UI designer. Generate a professional color palette in JSON format based on the user's description.
            The palette MUST contain exactly these CSS variables:
            --gray-950 (darkest background)
            --gray-900 (dark surface)
            --gray-800 (borders/secondary surfaces)
            --gray-700 (muted borders)
            --gray-400 (secondary text)
            --gray-100 (primary text)
            --accent-300 (light accent)
            --accent-400 (accent)
            --accent-500 (primary accent)
            --accent-600 (dark accent)
            --accent-700 (darkest accent)
            
            Return ONLY a JSON object with two fields:
            "name": A single word slug for the theme (e.g., "midnight-neon").
            "colors": An object mapping the CSS variables to hex codes.
            
            Description: %s
            """;

    public Map<String, String> generateTheme(String description) {
        ChatClient chatClient = chatClientProvider.getDefault();
        String prompt = String.format(THEME_GENERATION_PROMPT, description);
        
        String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        try {
            // Extract JSON if it's wrapped in markdown
            String json = response;
            if (json.contains("```json")) {
                json = json.substring(json.indexOf("```json") + 7, json.lastIndexOf("```"));
            } else if (json.contains("```")) {
                json = json.substring(json.indexOf("```") + 3, json.lastIndexOf("```"));
            }
            
            Map<String, Object> result = objectMapper.readValue(json, new TypeReference<>() {});
            String name = (String) result.get("name");
            @SuppressWarnings("unchecked")
            Map<String, String> colors = (Map<String, String>) result.get("colors");

            saveTheme(name, colors);
            
            return Map.of("name", name, "status", "success");
        } catch (Exception e) {
            log.error("Failed to parse AI theme response: {}", response, e);
            throw new RuntimeException("AI generated an invalid theme format. Please try again.");
        }
    }

    private void saveTheme(String name, Map<String, String> colors) throws Exception {
        String themesJson = settingsService.get("ui.themes_json", "{}");
        Map<String, Map<String, String>> themes = objectMapper.readValue(themesJson, new TypeReference<>() {});
        
        themes.put(name.toLowerCase().replace(" ", "-"), colors);
        
        settingsService.set("ui.themes_json", objectMapper.writeValueAsString(themes));
        settingsService.set("ui.theme", name.toLowerCase().replace(" ", "-"));
    }
}
