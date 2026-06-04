package com.aiframework.core.agent.multi;

/** Lifecycle of a planned sub-task on the {@link TaskBoard}. */
public enum TaskStatus {
    PENDING, RUNNING, DONE, FAILED, RETRYING, SKIPPED;

    public String lower() {
        return name().toLowerCase();
    }
}
