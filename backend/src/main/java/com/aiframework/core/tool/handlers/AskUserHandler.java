package com.aiframework.core.tool.handlers;

import com.aiframework.core.event.EventBus;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.aiframework.domain.entity.FormRequest;
import com.aiframework.domain.repository.FormRequestRepository;
import com.aiframework.service.FormSchemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AskUserHandler implements ToolHandler {

    private final FormRequestRepository formRequestRepository;
    private final EventBus eventBus;
    private final FormSchemaService formSchemaService;

    @Override
    public String handlerName() {
        return "ask_user";
    }

    @SuppressWarnings("unchecked")
    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        Map<String, Object> schema = (Map<String, Object>) args.get("form_schema");
        String reason = (String) args.getOrDefault("reason", "Additional input required");

        List<String> validationErrors = formSchemaService.validate(schema);
        if (!validationErrors.isEmpty()) {
            return ToolExecutionResult.error("Invalid form schema: " + String.join(", ", validationErrors));
        }

        Map<String, Object> normalizedSchema = formSchemaService.normalize(schema);

        FormRequest formRequest = FormRequest.builder()
                .conversationId(UUID.fromString(conversationId))
                .schema(normalizedSchema)
                .status("PENDING")
                .build();
        formRequest = formRequestRepository.save(formRequest);

        eventBus.publishFormRequest(conversationId, formRequest.getId().toString(), normalizedSchema);
        return ToolExecutionResult.formRequest(formRequest.getId().toString());
    }
}
