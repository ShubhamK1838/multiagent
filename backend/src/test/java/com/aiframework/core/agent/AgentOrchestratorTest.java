package com.aiframework.core.agent;

import com.aiframework.core.agent.AgentIterationEngine.IterationOutcome;
import com.aiframework.core.agent.AgentIterationEngine.IterationResult;
import com.aiframework.service.SettingsService;
import com.aiframework.service.monitoring.LogStreamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Verifies the single-agent runner's orchestration over the (mocked) iteration engine: it
 * publishes the turn lifecycle and maps each {@link IterationOutcome} to the right ending.
 * The loop semantics themselves are covered by {@link AgentIterationEngineTest}.
 */
@ExtendWith(MockitoExtension.class)
class AgentOrchestratorTest {

    @Mock AgentMessageBuilder messageBuilder;
    @Mock AgentIterationEngine iterationEngine;
    @Mock SettingsService settings;
    @Mock CancellationService cancellationService;
    @Mock LogStreamService logStreamService;
    @Mock TurnSupport turnSupport;

    private AgentOrchestrator orchestrator;
    private final String CONV_ID = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        orchestrator = new AgentOrchestrator(
                messageBuilder, iterationEngine, settings,
                cancellationService, logStreamService, turnSupport);
        when(messageBuilder.buildInitialMessages(any(), anyString(), any()))
                .thenReturn(new ArrayList<>(List.of()));
    }

    @Test
    void done_publishesStartThenEndWithContentAndSummarizes() {
        when(iterationEngine.run(any())).thenReturn(IterationResult.of(IterationOutcome.DONE, "The answer."));

        orchestrator.run(CONV_ID, List.of(), "hello", null);

        verify(turnSupport, times(1)).publishStart(eq(CONV_ID), eq("hello"));
        verify(turnSupport, times(1)).publishEnd(eq(CONV_ID), eq("The answer."));
        verify(turnSupport, times(1)).triggerMemory(eq(CONV_ID));
    }

    @Test
    void exhausted_publishesMaxIterationsMessage() {
        when(iterationEngine.run(any())).thenReturn(IterationResult.of(IterationOutcome.EXHAUSTED, null));

        orchestrator.run(CONV_ID, List.of(), "loop", null);

        verify(turnSupport, times(1)).publishEnd(eq(CONV_ID), argThat(s -> s.contains("Maximum iterations")));
    }

    @Test
    void cancelled_publishesCancellationMessage() {
        when(iterationEngine.run(any())).thenReturn(IterationResult.of(IterationOutcome.CANCELLED, null));

        orchestrator.run(CONV_ID, List.of(), "cancel", null);

        verify(turnSupport, times(1)).publishEnd(eq(CONV_ID), argThat(s -> s.contains("cancelled")));
    }

    @Test
    void paused_doesNotPublishEnd() {
        when(iterationEngine.run(any())).thenReturn(IterationResult.of(IterationOutcome.PAUSED, null));

        orchestrator.run(CONV_ID, List.of(), "need info", null);

        verify(turnSupport, never()).publishEnd(anyString(), anyString());
    }

    @Test
    void engineThrows_publishesFriendlyError() {
        when(iterationEngine.run(any())).thenThrow(new RuntimeException("boom"));
        when(turnSupport.friendlyError(any())).thenReturn("Something went wrong.");

        orchestrator.run(CONV_ID, List.of(), "hello", null);

        verify(turnSupport, times(1)).publishEnd(eq(CONV_ID), eq("Something went wrong."));
    }
}
