package com.aiframework.core.agent;

import com.aiframework.core.agent.multi.MultiAgentRunner;
import com.aiframework.core.agent.multi.MultiAgentSettings;
import com.aiframework.service.SettingsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AgentRunnerDispatcherTest {

    @Mock AgentOrchestrator singleAgentRunner;
    @Mock MultiAgentRunner multiAgentRunner;
    @Mock MultiAgentSettings multiAgentSettings;
    @Mock TurnClassifier turnClassifier;
    @Mock FastResponder fastResponder;
    @Mock SettingsService settings;

    private final String CONV_ID = UUID.randomUUID().toString();

    private AgentRunnerDispatcher dispatcher() {
        return new AgentRunnerDispatcher(singleAgentRunner, multiAgentRunner, multiAgentSettings,
                turnClassifier, fastResponder, settings);
    }

    @Test
    void routesToSingleAgentWhenMultiDisabledAndNotChitchat() {
        when(settings.getBoolean(eq("agent.fastpath.enabled"), anyBoolean())).thenReturn(true);
        when(turnClassifier.isChitchat("do a thing")).thenReturn(false);
        when(multiAgentSettings.isEnabled()).thenReturn(false);

        dispatcher().run(CONV_ID, List.of(), "do a thing", null);

        verify(singleAgentRunner, times(1)).run(eq(CONV_ID), any(), eq("do a thing"), isNull());
        verify(multiAgentRunner, never()).run(any(), any(), any(), any());
        verify(fastResponder, never()).run(any(), any(), any());
    }

    @Test
    void routesToMultiAgentWhenEnabledAndNotChitchat() {
        when(settings.getBoolean(eq("agent.fastpath.enabled"), anyBoolean())).thenReturn(true);
        when(turnClassifier.isChitchat(anyString())).thenReturn(false);
        when(multiAgentSettings.isEnabled()).thenReturn(true);

        dispatcher().run(CONV_ID, List.of(), "build a report", null);

        verify(multiAgentRunner, times(1)).run(eq(CONV_ID), any(), eq("build a report"), isNull());
        verify(singleAgentRunner, never()).run(any(), any(), any(), any());
        verify(fastResponder, never()).run(any(), any(), any());
    }

    @Test
    void routesChitchatToFastResponder() {
        when(settings.getBoolean(eq("agent.fastpath.enabled"), anyBoolean())).thenReturn(true);
        when(turnClassifier.isChitchat("hey jarvis")).thenReturn(true);

        dispatcher().run(CONV_ID, List.of(), "hey jarvis", null);

        verify(fastResponder, times(1)).run(eq(CONV_ID), any(), eq("hey jarvis"));
        verify(singleAgentRunner, never()).run(any(), any(), any(), any());
        verify(multiAgentRunner, never()).run(any(), any(), any(), any());
    }

    @Test
    void skipsFastPathWhenImagePresent() {
        when(settings.getBoolean(eq("agent.fastpath.enabled"), anyBoolean())).thenReturn(true);
        when(multiAgentSettings.isEnabled()).thenReturn(false);

        dispatcher().run(CONV_ID, List.of(), "hi", "imagedata");

        verify(singleAgentRunner, times(1)).run(eq(CONV_ID), any(), eq("hi"), eq("imagedata"));
        verify(fastResponder, never()).run(any(), any(), any());
    }
}
