package com.aiframework.api;

import com.aiframework.core.agent.AgentOrchestrator;
import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.AgentEventPublisher;
import com.aiframework.core.event.EventType;
import com.aiframework.domain.entity.FormRequest;
import com.aiframework.domain.repository.FormRequestRepository;
import com.aiframework.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/forms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FormController {

    private final FormRequestRepository formRequestRepository;
    private final AgentEventPublisher eventPublisher;
    private final AgentOrchestrator agentOrchestrator;
    private final ConversationService conversationService;

    @GetMapping("/{formId}")
    public FormRequest getForm(@PathVariable UUID formId) {
        return formRequestRepository.findById(formId)
                .orElseThrow(() -> new IllegalArgumentException("Form not found: " + formId));
    }

    @PostMapping("/{formId}/submit")
    public Map<String, String> submitForm(
            @PathVariable UUID formId,
            @RequestBody Map<String, Object> formData) {

        FormRequest formRequest = formRequestRepository.findById(formId)
                .orElseThrow(() -> new IllegalArgumentException("Form not found: " + formId));

        formRequest.setResponse(formData);
        formRequest.setStatus("RESOLVED");
        formRequest.setResolvedAt(Instant.now());
        formRequestRepository.save(formRequest);

        String conversationId = formRequest.getConversationId().toString();
        eventPublisher.publish(AgentEvent.of(EventType.FORM_RESOLVED, conversationId,
                "Form submitted", Map.of("formId", formId.toString())));

        // Resume agent with form data
        var history = conversationService.getHistory(formRequest.getConversationId());
        String formDataMessage = "User provided form data: " + formData;
        agentOrchestrator.run(conversationId, history, formDataMessage);

        return Map.of("status", "submitted", "formId", formId.toString());
    }
}
