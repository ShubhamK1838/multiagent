package com.aiframework.core.agent.multi;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Shared working memory for one multi-agent run: the goal plus each completed task's result,
 * in completion order. Downstream agents (critic, synthesizer) read the {@link #digest()} to
 * build on what the team has already produced. Created per run — not shared across conversations.
 */
public class Blackboard {

    private final String goal;
    private final Map<String, String> results = new LinkedHashMap<>();

    public Blackboard(String goal) {
        this.goal = goal;
    }

    public String goal() {
        return goal;
    }

    /** Records a task's result keyed by a human-readable label (role + task goal). */
    public synchronized void record(String label, String result) {
        results.put(label, result == null ? "" : result);
    }

    public synchronized boolean isEmpty() {
        return results.isEmpty();
    }

    /** A readable rollup of everything gathered so far, for prompting downstream agents. */
    public synchronized String digest() {
        if (results.isEmpty()) return "(no results gathered yet)";
        StringBuilder sb = new StringBuilder();
        results.forEach((label, value) ->
                sb.append("### ").append(label).append('\n').append(value).append("\n\n"));
        return sb.toString().trim();
    }
}
