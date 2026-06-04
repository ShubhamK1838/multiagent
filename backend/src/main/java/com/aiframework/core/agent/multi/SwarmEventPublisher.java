package com.aiframework.core.agent.multi;

import com.aiframework.core.event.AgentEvent;
import com.aiframework.core.event.EventBus;
import com.aiframework.core.event.EventType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Emits multi-agent observability events onto the existing per-conversation SSE channel.
 *
 * <p>All structured fields ride in {@link AgentEvent}'s {@code metadata} map, so no change to the
 * event/SSE contract is required. Wrapping {@link EventBus} here keeps that interface lean
 * (ISP) while giving the coordinator a focused, typed API.
 */
@Component
@RequiredArgsConstructor
public class SwarmEventPublisher {

    private final EventBus eventBus;

    /** A new agent has joined the turn. */
    public void agentSpawned(String conversationId, String agentId, String role,
                             String displayName, String model, String color) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("agentId", agentId);
        meta.put("role", role);
        meta.put("displayName", displayName);
        meta.put("model", model);
        meta.put("color", color);
        meta.put("status", "idle");
        publish(EventType.AGENT_SPAWNED, conversationId, displayName, meta);
    }

    /** An agent's status changed (idle | thinking | working | waiting | done | failed). */
    public void agentStatus(String conversationId, String agentId, String role, String status) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("agentId", agentId);
        meta.put("role", role);
        meta.put("status", status);
        publish(EventType.AGENT_STATUS, conversationId, status, meta);
    }

    /** An internal message between agents (from → to, or broadcast when {@code to} is null). */
    public void agentMessage(String conversationId, String from, String to, String type, String content) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("from", from);
        if (to != null) meta.put("to", to);
        meta.put("msgType", type);
        publish(EventType.AGENT_MESSAGE, conversationId, content, meta);
    }

    /** The planner produced a task plan. */
    public void coordinationPlan(String conversationId, String summary, int taskCount) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("taskCount", taskCount);
        publish(EventType.COORDINATION_PLAN, conversationId, summary, meta);
    }

    /** A sub-task was added to the board. */
    public void taskCreated(String conversationId, String taskId, String role,
                            String goal, List<String> dependsOn) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("taskId", taskId);
        meta.put("role", role);
        meta.put("dependsOn", dependsOn == null ? List.of() : dependsOn);
        publish(EventType.TASK_CREATED, conversationId, goal, meta);
    }

    /** A sub-task changed status (pending | running | done | failed | retrying | skipped). */
    public void taskUpdated(String conversationId, String taskId, String status,
                            int attempt, String resultSnippet) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("taskId", taskId);
        meta.put("status", status);
        meta.put("attempt", attempt);
        publish(EventType.TASK_UPDATED, conversationId, resultSnippet, meta);
    }

    private void publish(EventType type, String conversationId, String content, Map<String, Object> meta) {
        eventBus.publish(AgentEvent.of(type, conversationId, content, meta));
    }
}
