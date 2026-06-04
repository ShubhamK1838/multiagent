package com.aiframework.core.agent.multi;

import com.aiframework.domain.entity.AgentDefinition;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Hierarchical coordination: a PLANNER decomposes the goal into tasks, WORKER agents carry them
 * out (consulting the {@link FailurePolicy} on failure), an optional CRITIC reviews and may add
 * follow-up tasks for a bounded number of rounds, and a SYNTHESIZER composes the final answer.
 *
 * <p>Registered as bean {@code "orchestrator_worker"} so it can be selected by configuration;
 * alternative topologies are added as sibling beans without modifying this class (OCP).
 */
@Slf4j
@Component("orchestrator_worker")
@RequiredArgsConstructor
public class OrchestratorWorkerStrategy implements CoordinationStrategy {

    private static final int MAX_TASKS = 12;

    private final AgentFactory agentFactory;
    private final StructuredReasoner reasoner;
    private final FailurePolicy failurePolicy;
    private final MultiAgentSettings settings;
    private final SwarmEventPublisher events;
    private final AgentModelResolver modelResolver;
    private final ObjectMapper objectMapper;

    @Override
    public String coordinate(GoalContext goal, AgentTeam team) {
        String conv = goal.conversationId();
        Blackboard blackboard = new Blackboard(goal.userMessage());
        AgentMessageBus bus = new EventEmittingMessageBus(conv, events);
        AgentContext ctx = new AgentContext(conv, goal.userMessage(), blackboard, bus);
        TaskBoard board = new TaskBoard();

        announceTeam(conv, team);

        planInto(board, goal, team, bus);
        runUntilSettled(board, team, ctx, bus);

        return synthesize(goal, team, ctx, bus);
    }

    // ── Setup ────────────────────────────────────────────────────────────────

    private void announceTeam(String conv, AgentTeam team) {
        for (AgentDefinition def : team.members()) {
            events.agentSpawned(conv, def.getRoleKey(), def.getRoleKey(),
                    def.getDisplayName(), modelResolver.modelLabel(def), def.getColor());
        }
    }

    // ── Planning ───────────────────────────────────────────────────────────────

    private void planInto(TaskBoard board, GoalContext goal, AgentTeam team, AgentMessageBus bus) {
        List<AgentTask> tasks = new ArrayList<>();
        Optional<AgentDefinition> planner = team.planner();

        if (planner.isPresent()) {
            events.agentStatus(goal.conversationId(), AgentRole.PLANNER.key(), AgentRole.PLANNER.key(), "thinking");
            String raw = reasoner.complete(planner.get(), plannerPrompt(goal, team), goal.conversationId());
            tasks = parsePlan(raw);
            events.agentStatus(goal.conversationId(), AgentRole.PLANNER.key(), AgentRole.PLANNER.key(), "done");
            bus.post(AgentMessage.of(AgentRole.PLANNER.key(), null, "PROPOSAL",
                    "Planned " + tasks.size() + " task(s) toward the goal."));
        }

        if (tasks.isEmpty()) {
            // Fallback: a single task for the first available worker (or EXECUTOR by name).
            String role = team.workers().stream().findFirst()
                    .map(AgentDefinition::getRoleKey).orElse(AgentRole.EXECUTOR.key());
            tasks.add(new AgentTask("t1", role, goal.userMessage(), List.of()));
        }

        board.addAll(tasks);
        events.coordinationPlan(goal.conversationId(), "Plan with " + tasks.size() + " task(s)", tasks.size());
        for (AgentTask t : tasks) {
            events.taskCreated(goal.conversationId(), t.getId(), t.getRoleKey(), t.getGoal(), t.getDependsOn());
        }
    }

    private String plannerPrompt(GoalContext goal, AgentTeam team) {
        String roles = team.workers().stream().map(AgentDefinition::getRoleKey).reduce((a, b) -> a + ", " + b).orElse("EXECUTOR");
        return "User goal:\n" + goal.userMessage() + "\n\n"
                + "Available worker roles: " + roles + "\n\n"
                + "Produce a minimal task plan. Respond with ONLY a JSON object of this exact shape "
                + "(no prose, no code fences):\n"
                + "{\"tasks\":[{\"id\":\"t1\",\"role\":\"RESEARCHER\",\"goal\":\"...\",\"dependsOn\":[]}]}";
    }

    private List<AgentTask> parsePlan(String raw) {
        List<AgentTask> tasks = new ArrayList<>();
        try {
            String json = extractJson(raw);
            if (json == null) return tasks;
            JsonNode root = objectMapper.readTree(json);
            JsonNode arr = root.isArray() ? root : root.path("tasks");
            if (!arr.isArray()) return tasks;
            int idx = 1;
            for (JsonNode node : arr) {
                if (tasks.size() >= MAX_TASKS) break;
                String taskGoal = node.path("goal").asText("").trim();
                if (taskGoal.isEmpty()) continue;
                String id = node.path("id").asText("t" + idx);
                String role = node.path("role").asText(AgentRole.EXECUTOR.key()).trim();
                List<String> deps = new ArrayList<>();
                node.path("dependsOn").forEach(d -> deps.add(d.asText()));
                tasks.add(new AgentTask(id, role, taskGoal, deps));
                idx++;
            }
        } catch (Exception e) {
            log.warn("Failed to parse planner output, falling back to single task: {}", e.getMessage());
            return new ArrayList<>();
        }
        return tasks;
    }

    // ── Execution + critic rounds ────────────────────────────────────────────

    private void runUntilSettled(TaskBoard board, AgentTeam team, AgentContext ctx, AgentMessageBus bus) {
        int rounds = 0;
        int maxRounds = Math.max(1, settings.maxRounds());
        while (true) {
            drainReadyTasks(board, team, ctx, bus);
            skipBlockedTasks(board, ctx);

            rounds++;
            if (team.critic().isEmpty() || rounds >= maxRounds) break;

            List<AgentTask> followups = critique(board, team, ctx, bus);
            if (followups.isEmpty()) break;
            board.addAll(followups);
            for (AgentTask t : followups) {
                events.taskCreated(ctx.getConversationId(), t.getId(), t.getRoleKey(), t.getGoal(), t.getDependsOn());
            }
        }
    }

    private void drainReadyTasks(TaskBoard board, AgentTeam team, AgentContext ctx, AgentMessageBus bus) {
        Optional<AgentTask> next;
        while ((next = board.nextReady()).isPresent()) {
            runTask(next.get(), team, ctx, bus);
        }
    }

    /** Any PENDING task whose dependencies cannot complete is skipped so the run can settle. */
    private void skipBlockedTasks(TaskBoard board, AgentContext ctx) {
        for (AgentTask t : board.all()) {
            if (t.getStatus() == TaskStatus.PENDING) {
                t.setStatus(TaskStatus.SKIPPED);
                events.taskUpdated(ctx.getConversationId(), t.getId(), TaskStatus.SKIPPED.lower(), t.getAttempts(), null);
            }
        }
    }

    private void runTask(AgentTask task, AgentTeam team, AgentContext ctx, AgentMessageBus bus) {
        Optional<AgentDefinition> workerDef = team.workerFor(task.getRoleKey());
        if (workerDef.isEmpty()) {
            failTask(task, ctx, "no worker available for role " + task.getRoleKey());
            return;
        }
        Agent agent = agentFactory.create(workerDef.get(), false, false);
        String agentRole = workerDef.get().getRoleKey();
        int maxRetries = settings.maxRetries();

        bus.post(AgentMessage.of(AgentRole.PLANNER.key(), agentRole, "HANDOFF", task.getGoal()));

        while (true) {
            task.setAttempts(task.getAttempts() + 1);
            task.setStatus(TaskStatus.RUNNING);
            events.taskUpdated(ctx.getConversationId(), task.getId(), TaskStatus.RUNNING.lower(), task.getAttempts(), null);
            events.agentStatus(ctx.getConversationId(), agentRole, agentRole, "working");

            AgentResult result = agent.execute(task, ctx);

            if (result.isSuccess()) {
                task.setResult(result.getContent());
                task.setStatus(TaskStatus.DONE);
                ctx.getBlackboard().record(agentRole + " — " + task.getGoal(), result.getContent());
                bus.post(AgentMessage.of(agentRole, null, "RESULT", result.getContent()));
                events.taskUpdated(ctx.getConversationId(), task.getId(), TaskStatus.DONE.lower(),
                        task.getAttempts(), snippet(result.getContent()));
                events.agentStatus(ctx.getConversationId(), agentRole, agentRole, "done");
                return;
            }

            FailureDecision decision = failurePolicy.decide(task, result, task.getAttempts(), maxRetries);
            if (decision == FailureDecision.RETRY || decision == FailureDecision.REASSIGN) {
                task.setStatus(TaskStatus.RETRYING);
                events.taskUpdated(ctx.getConversationId(), task.getId(), TaskStatus.RETRYING.lower(),
                        task.getAttempts(), result.getError());
                events.agentStatus(ctx.getConversationId(), agentRole, agentRole, "thinking");
                continue;
            }
            failTask(task, ctx, result.getError());
            events.agentStatus(ctx.getConversationId(), agentRole, agentRole, "failed");
            return;
        }
    }

    private void failTask(AgentTask task, AgentContext ctx, String error) {
        task.setError(error);
        task.setStatus(TaskStatus.FAILED);
        ctx.getBlackboard().record("FAILED — " + task.getGoal(), "Task failed: " + error);
        events.taskUpdated(ctx.getConversationId(), task.getId(), TaskStatus.FAILED.lower(), task.getAttempts(), error);
    }

    private List<AgentTask> critique(TaskBoard board, AgentTeam team, AgentContext ctx, AgentMessageBus bus) {
        AgentDefinition critic = team.critic().orElseThrow();
        events.agentStatus(ctx.getConversationId(), AgentRole.CRITIC.key(), AgentRole.CRITIC.key(), "thinking");
        String raw = reasoner.complete(critic, criticPrompt(ctx), ctx.getConversationId());
        events.agentStatus(ctx.getConversationId(), AgentRole.CRITIC.key(), AgentRole.CRITIC.key(), "done");

        List<AgentTask> followups = new ArrayList<>();
        boolean approved = true;
        try {
            String json = extractJson(raw);
            if (json != null) {
                JsonNode root = objectMapper.readTree(json);
                approved = root.path("approved").asBoolean(true);
                JsonNode arr = root.path("followups");
                if (arr.isArray()) {
                    int idx = board.all().size() + 1;
                    for (JsonNode node : arr) {
                        if (followups.size() >= MAX_TASKS) break;
                        String g = node.path("goal").asText("").trim();
                        if (g.isEmpty()) continue;
                        String role = node.path("role").asText(AgentRole.EXECUTOR.key()).trim();
                        followups.add(new AgentTask("t" + idx++, role, g, List.of()));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse critic output: {}", e.getMessage());
        }
        bus.post(AgentMessage.of(AgentRole.CRITIC.key(), null, "CRITIQUE",
                approved && followups.isEmpty() ? "Goal satisfied." : "Requested " + followups.size() + " follow-up(s)."));
        return approved ? List.of() : followups;
    }

    private String criticPrompt(AgentContext ctx) {
        return "User goal:\n" + ctx.getGoal() + "\n\n"
                + "Team results so far:\n" + ctx.getBlackboard().digest() + "\n\n"
                + "Is the goal fully and correctly met? Respond with ONLY this JSON (no prose):\n"
                + "{\"approved\":true|false,\"followups\":[{\"role\":\"EXECUTOR\",\"goal\":\"...\"}]}";
    }

    // ── Synthesis ────────────────────────────────────────────────────────────

    private String synthesize(GoalContext goal, AgentTeam team, AgentContext ctx, AgentMessageBus bus) {
        Optional<AgentDefinition> synth = team.synthesizer();
        if (synth.isEmpty()) {
            return ctx.getBlackboard().isEmpty()
                    ? "I could not complete the request."
                    : ctx.getBlackboard().digest();
        }
        events.agentStatus(goal.conversationId(), AgentRole.SYNTHESIZER.key(), AgentRole.SYNTHESIZER.key(), "working");
        Agent agent = agentFactory.create(synth.get(), true, true);
        AgentTask task = new AgentTask("synthesis", AgentRole.SYNTHESIZER.key(), goal.userMessage(), List.of());
        AgentResult result = agent.execute(task, ctx);
        events.agentStatus(goal.conversationId(), AgentRole.SYNTHESIZER.key(), AgentRole.SYNTHESIZER.key(),
                result.isSuccess() ? "done" : "failed");

        if (result.isSuccess() && result.getContent() != null && !result.getContent().isBlank()) {
            return result.getContent();
        }
        return ctx.getBlackboard().isEmpty()
                ? "I could not complete the request."
                : ctx.getBlackboard().digest();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Extracts the first balanced JSON object/array substring, tolerating prose or code fences. */
    private String extractJson(String raw) {
        if (raw == null) return null;
        String s = raw.strip();
        int objStart = s.indexOf('{');
        int arrStart = s.indexOf('[');
        int start = (arrStart >= 0 && (objStart < 0 || arrStart < objStart)) ? arrStart : objStart;
        if (start < 0) return null;
        char open = s.charAt(start);
        char close = open == '{' ? '}' : ']';
        int end = s.lastIndexOf(close);
        if (end <= start) return null;
        return s.substring(start, end + 1);
    }

    private String snippet(String content) {
        if (content == null) return null;
        String c = content.strip();
        return c.length() <= 160 ? c : c.substring(0, 160) + "…";
    }
}
