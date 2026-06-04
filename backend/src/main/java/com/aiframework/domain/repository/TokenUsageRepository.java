package com.aiframework.domain.repository;

import com.aiframework.domain.entity.TokenUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface TokenUsageRepository extends JpaRepository<TokenUsage, UUID> {

    /** Grand totals across all usage: [promptTokens, completionTokens, totalTokens, totalCost, calls] (single row). */
    @Query(value = "SELECT COALESCE(SUM(prompt_tokens),0), COALESCE(SUM(completion_tokens),0), " +
            "COALESCE(SUM(total_tokens),0), COALESCE(SUM(total_cost),0), COUNT(*) " +
            "FROM token_usage", nativeQuery = true)
    List<Object[]> totals();

    /** Per-model breakdown: [model_name, provider, total_tokens, total_cost, calls]. */
    @Query(value = "SELECT COALESCE(model_name,'unknown'), COALESCE(provider,'unknown'), " +
            "SUM(total_tokens), SUM(total_cost), COUNT(*) " +
            "FROM token_usage GROUP BY model_name, provider ORDER BY SUM(total_cost) DESC",
            nativeQuery = true)
    List<Object[]> byModel();

    /** Daily series (last 30 days): [day (yyyy-mm-dd), total_tokens, total_cost]. */
    @Query(value = "SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD'), " +
            "SUM(total_tokens), SUM(total_cost) " +
            "FROM token_usage WHERE created_at >= NOW() - INTERVAL '30 days' " +
            "GROUP BY 1 ORDER BY 1", nativeQuery = true)
    List<Object[]> dailySeries();

    /** Per-conversation breakdown: [conversation_id, title, total_tokens, total_cost, calls]. */
    @Query(value = "SELECT t.conversation_id, COALESCE(c.title,'(deleted)'), " +
            "SUM(t.total_tokens), SUM(t.total_cost), COUNT(*) " +
            "FROM token_usage t LEFT JOIN conversations c ON c.id = t.conversation_id " +
            "GROUP BY t.conversation_id, c.title ORDER BY SUM(t.total_cost) DESC LIMIT :limit",
            nativeQuery = true)
    List<Object[]> byConversation(int limit);
}
