package com.aiframework.api;

import com.aiframework.service.ai.AiService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/command")
    public Map<String, String> processCommand(@RequestBody Map<String, String> request) {
        String command = request.get("command");
        String response = aiService.processCommand(command);
        return Map.of("response", response);
    }
}
