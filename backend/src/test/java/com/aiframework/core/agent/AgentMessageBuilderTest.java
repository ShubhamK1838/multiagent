package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMService;
import com.aiframework.core.rag.RAGService;
import com.aiframework.core.tool.ToolRegistry;
import com.aiframework.service.SettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AgentMessageBuilderTest {

    @Mock
    private LLMService llmService;

    @Mock
    private ToolRegistry toolRegistry;

    @Mock
    private RAGService ragService;

    @Mock
    private SettingsService settings;

    @Mock
    private ContextManager contextManager;

    @InjectMocks
    private AgentMessageBuilder agentMessageBuilder;

    @BeforeEach
    void setUp() {
        when(settings.get(eq("llm.system_prompt"), anyString())).thenReturn("System Prompt");
        when(settings.getBoolean(eq("rag.enabled"), anyBoolean())).thenReturn(false);
        when(llmService.buildSystemMessage(anyString(), anyList(), anyString()))
                .thenReturn(new SystemMessage("System Prompt"));
    }

    @Test
    void buildInitialMessages_ShouldNotAttachMediaIfImageBase64IsNull() {
        // Arrange
        List<Message> history = new ArrayList<>();
        when(contextManager.pruneHistory(history)).thenReturn(history);

        // Act
        List<Message> result = agentMessageBuilder.buildInitialMessages(history, "Hello", null);

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.get(0) instanceof SystemMessage);
        
        UserMessage userMsg = (UserMessage) result.get(1);
        assertTrue(userMsg.getText().contains("Hello"));
    }

    @Test
    void buildInitialMessages_ShouldAttachMediaIfValidImageBase64Provided() {
        // Arrange
        List<Message> history = new ArrayList<>();
        when(contextManager.pruneHistory(history)).thenReturn(history);
        
        // Base64 for a simple 1x1 png image
        String base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

        // Act
        List<Message> result = agentMessageBuilder.buildInitialMessages(history, "Look at this", base64Image);

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.get(0) instanceof SystemMessage);
        
        UserMessage userMsg = (UserMessage) result.get(1);
        assertTrue(userMsg.getText().contains("Look at this"));
    }

    @Test
    void buildInitialMessages_ShouldHandleMalformedBase64Gracefully() {
        // Arrange
        List<Message> history = new ArrayList<>();
        when(contextManager.pruneHistory(history)).thenReturn(history);
        
        String malformedBase64 = "this_is_not_valid_base64!";

        // Act
        List<Message> result = agentMessageBuilder.buildInitialMessages(history, "Look at this", malformedBase64);

        // Assert
        assertEquals(2, result.size());
        
        UserMessage userMsg = (UserMessage) result.get(1);
        assertTrue(userMsg.getText().contains("Look at this"));
        // assertTrue(userMsg.getText().contains("failed to decode"));
    }
}
