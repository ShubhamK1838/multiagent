package com.aiframework.api;

import com.aiframework.domain.repository.TokenUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Read-only analytics for token usage and estimated cost (Token & Cost Dashboard).
 */
@RestController
@RequestMapping("/api/v1/usage")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TokenUsageController {

    private final TokenUsageRepository repository;

    public record Totals(long promptTokens, long completionTokens, long totalTokens,
                         BigDecimal totalCost, long calls) {}

    public record ModelUsage(String modelName, String provider, long totalTokens,
                             BigDecimal totalCost, long calls) {}

    public record DailyUsage(String day, long totalTokens, BigDecimal totalCost) {}

    public record ConversationUsage(String conversationId, String title, long totalTokens,
                                    BigDecimal totalCost, long calls) {}

    public record UsageSummary(Totals totals, List<ModelUsage> byModel, List<DailyUsage> daily) {}

    @GetMapping("/summary")
    public UsageSummary summary() {
        return new UsageSummary(totals(), byModel(), daily());
    }

    @GetMapping("/by-conversation")
    public List<ConversationUsage> byConversation(@RequestParam(defaultValue = "50") int limit) {
        List<ConversationUsage> out = new ArrayList<>();
        for (Object[] r : repository.byConversation(limit)) {
            out.add(new ConversationUsage(
                    r[0] != null ? r[0].toString() : null,
                    str(r[1]),
                    lng(r[2]), dec(r[3]), lng(r[4])));
        }
        return out;
    }

    private Totals totals() {
        List<Object[]> rows = repository.totals();
        if (rows.isEmpty()) return new Totals(0, 0, 0, BigDecimal.ZERO, 0);
        Object[] r = rows.get(0);
        return new Totals(lng(r[0]), lng(r[1]), lng(r[2]), dec(r[3]), lng(r[4]));
    }

    private List<ModelUsage> byModel() {
        List<ModelUsage> out = new ArrayList<>();
        for (Object[] r : repository.byModel()) {
            out.add(new ModelUsage(str(r[0]), str(r[1]), lng(r[2]), dec(r[3]), lng(r[4])));
        }
        return out;
    }

    private List<DailyUsage> daily() {
        List<DailyUsage> out = new ArrayList<>();
        for (Object[] r : repository.dailySeries()) {
            out.add(new DailyUsage(str(r[0]), lng(r[1]), dec(r[2])));
        }
        return out;
    }

    // ── Null-safe coercion of native-query scalars ──────────────────────────
    private static long lng(Object o) {
        return o instanceof Number n ? n.longValue() : 0L;
    }

    private static BigDecimal dec(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal b) return b;
        if (o instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return BigDecimal.ZERO;
    }

    private static String str(Object o) {
        return o != null ? o.toString() : null;
    }
}
