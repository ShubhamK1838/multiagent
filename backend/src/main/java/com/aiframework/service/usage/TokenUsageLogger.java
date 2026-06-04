package com.aiframework.service.usage;

import com.aiframework.domain.entity.AiModel;
import com.aiframework.domain.entity.TokenUsage;
import com.aiframework.domain.repository.TokenUsageRepository;
import com.aiframework.service.aimodel.TokenCostCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Persists one {@link TokenUsage} row per LLM completion, computing cost from
 * the model's pricing. Mirrors the async fire-and-forget style of
 * {@link com.aiframework.service.ToolExecutionLogger}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenUsageLogger {

    private final TokenUsageRepository repository;
    private final TokenCostCalculator costCalculator;

    /** Rough fallback when a provider does not report usage: ~4 chars per token. */
    public static int estimateTokens(String text) {
        if (text == null || text.isEmpty()) return 0;
        return Math.max(1, (int) Math.ceil(text.length() / 4.0));
    }

    @Async
    public void record(UUID conversationId, AiModel model,
                       int promptTokens, int completionTokens, boolean estimated) {
        try {
            int total = promptTokens + completionTokens;
            BigDecimal inputCost = costCalculator.inputCost(model, promptTokens);
            BigDecimal outputCost = costCalculator.outputCost(model, completionTokens);

            TokenUsage usage = TokenUsage.builder()
                    .conversationId(conversationId)
                    .modelId(model != null ? model.getId() : null)
                    .modelName(model != null ? model.getName() : null)
                    .provider(model != null && model.getProvider() != null
                            ? model.getProvider().name() : null)
                    .promptTokens(promptTokens)
                    .completionTokens(completionTokens)
                    .totalTokens(total)
                    .inputCost(inputCost)
                    .outputCost(outputCost)
                    .totalCost(inputCost.add(outputCost))
                    .estimated(estimated)
                    .build();
            repository.save(usage);
        } catch (Exception e) {
            log.warn("Failed to record token usage: {}", e.getMessage());
        }
    }
}
