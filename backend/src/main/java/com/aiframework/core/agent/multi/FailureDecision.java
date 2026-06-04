package com.aiframework.core.agent.multi;

/** What the coordinator should do when a task fails. */
public enum FailureDecision {
    /** Try the same task again. */
    RETRY,
    /** Hand the task to a different worker role. */
    REASSIGN,
    /** Give up on this task; record the failure and continue best-effort toward the goal. */
    ESCALATE,
    /** Abort the whole run. */
    ABORT
}
