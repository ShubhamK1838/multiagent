package com.aiframework.core.agent;

import com.aiframework.core.ai.LLMResponse;
import com.aiframework.core.ai.LLMService;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.service.monitoring.LogStreamService;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * The reason → act → observe loop shared by every agent in the system.
 *
 * <p>Extracted from {@link AgentOrchestrator} so both the single-agent path and each per-role
 * worker agent in the multi-agent path run identical iteration semantics (DRY). The engine is
 * stateless; per-turn state lives in the supplied {@link IterationContext}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentIterationEngine {

    private final LLMService llmService;
    private final ToolCallExecutor toolCallExecutor;
    private final CancellationService cancellationService;
    private final LogStreamService logStreamService;
    private final EventBus eventBus;

    /** Runs the loop until a terminal outcome is reached or the iteration budget is exhausted. */
    public IterationResult run(IterationContext ctx) {
        for (int i = 0; i < ctx.getMaxIterations(); i++) {
            if (cancellationService.isCancelled(ctx.getConversationId())) {
                return IterationResult.of(IterationOutcome.CANCELLED, null);
            }
            IterationResult step = runSingleIteration(ctx);
            if (step.getOutcome() != IterationOutcome.CONTINUE) return step;
        }
        return IterationResult.of(IterationOutcome.EXHAUSTED, null);
    }

    private IterationResult runSingleIteration(IterationContext ctx) {
        LLMResponse response = invokeModel(ctx);

        if (cancellationService.isCancelled(ctx.getConversationId())) {
            return IterationResult.of(IterationOutcome.CANCELLED, null);
        }

        if (!response.isToolCall()) {
            String content = response.getContent();
            if (content == null || content.isBlank()) {
                logStreamService.warn("LLM", "⚠ Blank final answer received, nudging model to respond");
                ctx.getMessages().add(new UserMessage(
                        "[SYSTEM] Your last response was empty. Please provide your actual answer now."));
                return IterationResult.of(IterationOutcome.CONTINUE, null);
            }
            logStreamService.agent("LLM", "✦ FINAL_ANSWER " + truncate(content, 80));
            return IterationResult.of(IterationOutcome.DONE, content);
        }

        logStreamService.agent("LLM", "→ TOOL_INVOKE: " + response.getToolName());
        publishThinkingIfPresent(ctx.getConversationId(), response);
        ToolExecutionResult result = toolCallExecutor.execute(response, ctx.getConversationId());

        if (cancellationService.isCancelled(ctx.getConversationId())) {
            return IterationResult.of(IterationOutcome.CANCELLED, null);
        }
        if (result.isRequiresUserInput()) {
            return IterationResult.of(IterationOutcome.PAUSED, null);
        }
        toolCallExecutor.appendToolExchange(ctx.getMessages(), response, result);
        return IterationResult.of(IterationOutcome.CONTINUE, null);
    }

    private LLMResponse invokeModel(IterationContext ctx) {
        if (ctx.getClient() == null) {
            // Default client + full token streaming — preserves the original single-agent behaviour.
            return llmService.chat(ctx.getMessages(), ctx.getConversationId());
        }
        return llmService.chat(ctx.getMessages(), ctx.getConversationId(), ctx.getClient(), ctx.isStreamTokens());
    }

    private void publishThinkingIfPresent(String conversationId, LLMResponse response) {
        String reasoning = response.getReasoning();
        if (reasoning != null && !reasoning.isBlank()) {
            logStreamService.agent("LLM", "💭 THINKING: " + truncate(reasoning, 80));
            eventBus.publishThinking(conversationId, reasoning);
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    public enum IterationOutcome { CONTINUE, DONE, PAUSED, EXHAUSTED, CANCELLED }

    /** Per-turn input to the loop. A null {@code client} selects the default client + streaming. */
    @Getter
    @Builder
    public static class IterationContext {
        private final String conversationId;
        private final List<Message> messages;
        /** Per-role model client; {@code null} → default client with token streaming. */
        private final ChatClient client;
        /** Whether answer tokens stream to the conversation SSE channel. Workers pass {@code false}. */
        @Builder.Default
        private final boolean streamTokens = true;
        private final int maxIterations;
    }

    /** Terminal result of the loop. {@code content} is the final answer when outcome is DONE. */
    @Getter
    public static class IterationResult {
        private final IterationOutcome outcome;
        private final String content;

        private IterationResult(IterationOutcome outcome, String content) {
            this.outcome = outcome;
            this.content = content;
        }

        public static IterationResult of(IterationOutcome outcome, String content) {
            return new IterationResult(outcome, content);
        }
    }
}
