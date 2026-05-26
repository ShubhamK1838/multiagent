package com.aiframework.service.memory;

import com.aiframework.service.aimodel.ChatClientProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Makes a silent LLM call for internal purposes (e.g., memory summarization).
 * Does NOT publish SSE token events — the user never sees this exchange.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MemoryChatClient {

    private final ChatClientProvider chatClientProvider;

    public String chat(List<Message> messages) {
        try {
            return chatClientProvider.getDefault()
                    .prompt()
                    .messages(messages)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Silent LLM call for memory summarization failed", e);
            return "";
        }
    }
}
