package com.aiframework.core.agent.multi;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * A unit of work produced by the planner and carried out by a worker agent. Mutable: the board
 * and coordinator advance its {@link TaskStatus}, attempt count, and result/error as it runs.
 */
@Getter
public class AgentTask {

    private final String id;
    private final String roleKey;
    private final String goal;
    private final List<String> dependsOn;

    @Setter private TaskStatus status = TaskStatus.PENDING;
    @Setter private int attempts = 0;
    @Setter private String result;
    @Setter private String error;

    public AgentTask(String id, String roleKey, String goal, List<String> dependsOn) {
        this.id = id;
        this.roleKey = roleKey;
        this.goal = goal;
        this.dependsOn = dependsOn == null ? List.of() : dependsOn;
    }
}
