package com.aiframework.service.aimodel;

import com.aiframework.domain.entity.AiModel;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

/**
 * Computes the dollar cost of an LLM completion from per-model pricing.
 *
 * Pricing is stored in {@link AiModel#getOptions()} under the keys
 * {@code costPerMillionInputTokens} and {@code costPerMillionOutputTokens}
 * (USD per 1,000,000 tokens). Missing/unparseable values are treated as 0.
 */
@Component
public class TokenCostCalculator {

    public static final String INPUT_KEY = "costPerMillionInputTokens";
    public static final String OUTPUT_KEY = "costPerMillionOutputTokens";

    private static final BigDecimal MILLION = new BigDecimal("1000000");

    public BigDecimal inputCost(AiModel model, int promptTokens) {
        return cost(rate(model, INPUT_KEY), promptTokens);
    }

    public BigDecimal outputCost(AiModel model, int completionTokens) {
        return cost(rate(model, OUTPUT_KEY), completionTokens);
    }

    private BigDecimal cost(BigDecimal perMillion, int tokens) {
        if (perMillion.signum() == 0 || tokens <= 0) return BigDecimal.ZERO;
        return perMillion.multiply(BigDecimal.valueOf(tokens))
                .divide(MILLION, 6, RoundingMode.HALF_UP);
    }

    private BigDecimal rate(AiModel model, String key) {
        if (model == null || model.getOptions() == null) return BigDecimal.ZERO;
        Map<String, Object> options = model.getOptions();
        Object raw = options.get(key);
        if (raw == null) return BigDecimal.ZERO;
        try {
            return new BigDecimal(raw.toString().trim());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
}
