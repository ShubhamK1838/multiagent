package com.aiframework.service.ai;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class DefaultAiServiceTest {

    @Test
    public void testProcessCommandGreeting() {
        NaturalLanguageProcessor nlp = mock(NaturalLanguageProcessor.class);
        ContextualMemoryService memory = mock(ContextualMemoryService.class);

        when(nlp.parseIntent("hello jarvis")).thenReturn("greeting");

        DefaultAiService service = new DefaultAiService(nlp, memory);
        String response = service.processCommand("hello jarvis");

        assertEquals("Hello, Sir. How can I assist you today?", response);
    }

    @Test
    public void testProcessCommandUnknown() {
        NaturalLanguageProcessor nlp = mock(NaturalLanguageProcessor.class);
        ContextualMemoryService memory = mock(ContextualMemoryService.class);

        when(nlp.parseIntent("do something")).thenReturn("unknown");

        DefaultAiService service = new DefaultAiService(nlp, memory);
        String response = service.processCommand("do something");

        assertEquals("Command received. Processing...", response);
    }
}
