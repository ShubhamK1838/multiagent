package com.aiframework.core.agent.multi;

import org.springframework.stereotype.Component;

/**
 * Default resilience: retry a failed task up to the configured budget, then escalate (record the
 * failure and continue best-effort so partial results still reach synthesis). Never aborts the
 * whole run on a single task failure.
 */
@Component
public class RetryWithBackoffPolicy implements FailurePolicy {

    @Override
    public FailureDecision decide(AgentTask task, AgentResult result, int attempt, int maxRetries) {
        if (attempt <= maxRetries) {
            return FailureDecision.RETRY;
        }
        return FailureDecision.ESCALATE;
    }
}
