package com.aiframework.core.agent.multi;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Holds the run's task DAG and answers readiness queries. A task is "ready" when it is PENDING
 * and every task it depends on has completed. Not thread-safe by design — the orchestrator-worker
 * strategy drives it sequentially.
 */
public class TaskBoard {

    private final List<AgentTask> tasks = new ArrayList<>();

    public void add(AgentTask task) {
        tasks.add(task);
    }

    public void addAll(List<AgentTask> newTasks) {
        tasks.addAll(newTasks);
    }

    public List<AgentTask> all() {
        return List.copyOf(tasks);
    }

    public Optional<AgentTask> get(String id) {
        return tasks.stream().filter(t -> t.getId().equals(id)).findFirst();
    }

    /** Next PENDING task whose dependencies are all DONE. */
    public Optional<AgentTask> nextReady() {
        return tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.PENDING)
                .filter(this::dependenciesSatisfied)
                .findFirst();
    }

    public boolean hasFailures() {
        return tasks.stream().anyMatch(t -> t.getStatus() == TaskStatus.FAILED);
    }

    public boolean isComplete() {
        return tasks.stream().noneMatch(t ->
                t.getStatus() == TaskStatus.PENDING || t.getStatus() == TaskStatus.RUNNING
                        || t.getStatus() == TaskStatus.RETRYING);
    }

    private boolean dependenciesSatisfied(AgentTask task) {
        return task.getDependsOn().stream()
                .map(this::get)
                .allMatch(dep -> dep.isPresent() && dep.get().getStatus() == TaskStatus.DONE);
    }
}
