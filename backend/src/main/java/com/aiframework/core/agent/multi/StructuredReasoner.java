package com.aiframework.core.agent.multi;

import com.aiframework.core.ai.ChatStreamingService;
import com.aiframework.domain.entity.AgentDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Single-shot reasoning for roles that produce structured output rather than running a tool loop
 * (PLANNER, CRITIC). Bypasses the TOOL_CALL/FINAL_ANSWER envelope and returns the model's raw
 * text, which the caller parses (e.g. as a JSON plan). Streams silently so nothing leaks onto the
 * user-facing answer channel.
 */
@Component
@RequiredArgsConstructor
public class StructuredReasoner {

    private final ChatStreamingService chatStreamingService;
    private final AgentModelResolver modelResolver;

    public String complete(AgentDefinition def, String userPrompt, String conversationId) {
        ChatClient client = modelResolver.resolveClient(def);
        List<Message> messages = List.of(
                new SystemMessage(def.getSystemPrompt()),
                new UserMessage(userPrompt));
        return chatStreamingService.stream(client, messages, conversationId, false);
    }
}
