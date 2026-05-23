package com.aiframework.service.ai;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import com.aiframework.service.aimodel.ChatClientProvider;
import org.springframework.ai.chat.client.ChatClient;

public class DefaultAiServiceTest {

    @Test
    public void testProcessCommandGreeting() {
        NaturalLanguageProcessor nlp = mock(NaturalLanguageProcessor.class);
        ContextualMemoryService memory = mock(ContextualMemoryService.class);
        ChatClientProvider chatClientProvider = mock(ChatClientProvider.class);

        when(nlp.parseIntent("hello jarvis")).thenReturn("greeting");

        DefaultAiService service = new DefaultAiService(nlp, memory, chatClientProvider);
        String response = service.processCommand("hello jarvis");

        assertEquals("Hello, Sir. How can I assist you today?", response);
    }

    @Test
    public void testProcessCommandUnknown() {
        NaturalLanguageProcessor nlp = mock(NaturalLanguageProcessor.class);
        ContextualMemoryService memory = mock(ContextualMemoryService.class);
        ChatClientProvider chatClientProvider = mock(ChatClientProvider.class);

        when(nlp.parseIntent("do something")).thenReturn("unknown");

        DefaultAiService service = new DefaultAiService(nlp, memory, chatClientProvider);
        String response = service.processCommand("do something");

        // The default fallback when AI fails
        assertEquals("Command received. Processing... (AI generation failed)", response);
    }
}
