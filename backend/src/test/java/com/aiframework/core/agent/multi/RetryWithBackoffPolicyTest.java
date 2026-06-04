package com.aiframework.core.agent.multi;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RetryWithBackoffPolicyTest {

    private final RetryWithBackoffPolicy policy = new RetryWithBackoffPolicy();
    private final AgentTask task = new AgentTask("t1", "EXECUTOR", "do it", List.of());
    private final AgentResult failure = AgentResult.fail("boom");

    @Test
    void retriesWhileWithinBudget() {
        assertEquals(FailureDecision.RETRY, policy.decide(task, failure, 1, 2));
        assertEquals(FailureDecision.RETRY, policy.decide(task, failure, 2, 2));
    }

    @Test
    void escalatesOnceBudgetExceeded() {
        assertEquals(FailureDecision.ESCALATE, policy.decide(task, failure, 3, 2));
    }

    @Test
    void zeroRetryBudget_escalatesImmediately() {
        assertEquals(FailureDecision.ESCALATE, policy.decide(task, failure, 1, 0));
    }
}
