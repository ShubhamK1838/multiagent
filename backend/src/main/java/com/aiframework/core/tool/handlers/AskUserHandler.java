package com.aiframework.core.tool.handlers;

import com.aiframework.core.event.EventBus;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.aiframework.domain.entity.FormRequest;
import com.aiframework.domain.repository.FormRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AskUserHandler implements ToolHandler {

    private final FormRequestRepository formRequestRepository;
    private final EventBus eventBus;

    @Override
    public String handlerName() {
        return "ask_user";
    }

    @SuppressWarnings("unchecked")
    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        Map<String, Object> schema = (Map<String, Object>) args.get("form_schema");

        FormRequest formRequest = FormRequest.builder()
                .conversationId(UUID.fromString(conversationId))
                .schema(schema)
                .status("PENDING")
                .build();
        formRequest = formRequestRepository.save(formRequest);

        eventBus.publishFormRequest(conversationId, formRequest.getId().toString(), schema);
        return ToolExecutionResult.formRequest(formRequest.getId().toString());
    }
}
