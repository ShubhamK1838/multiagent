package com.aiframework.core.agent.multi;

import com.aiframework.core.agent.AgentIterationEngine;
import com.aiframework.core.agent.AgentIterationEngine.IterationContext;
import com.aiframework.core.agent.AgentIterationEngine.IterationOutcome;
import com.aiframework.core.agent.AgentIterationEngine.IterationResult;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;

import java.util.ArrayList;
import java.util.List;

/**
 * An agentic worker (or the synthesizer): runs the shared {@link AgentIterationEngine} with a
 * role-scoped system prompt and its own model, so it can call tools to accomplish its task.
 * Instances are built per run by {@link AgentFactory}; they are not Spring beans.
 */
public class LlmAgent implements Agent {

    private final String roleKey;
    private final ChatClient client;
    private final SystemMessage systemMessage;
    private final int maxIterations;
    private final boolean streamTokens;
    private final AgentIterationEngine engine;

    public LlmAgent(String roleKey, ChatClient client, SystemMessage systemMessage,
                    int maxIterations, boolean streamTokens, AgentIterationEngine engine) {
        this.roleKey = roleKey;
        this.client = client;
        this.systemMessage = systemMessage;
        this.maxIterations = maxIterations;
        this.streamTokens = streamTokens;
        this.engine = engine;
    }

    @Override
    public String roleKey() {
        return roleKey;
    }

    @Override
    public AgentResult execute(AgentTask task, AgentContext context) {
        try {
            List<Message> messages = new ArrayList<>();
            messages.add(systemMessage);
            messages.add(new UserMessage(buildUserPrompt(task, context)));

            IterationResult result = engine.run(IterationContext.builder()
                    .conversationId(context.getConversationId())
                    .messages(messages)
                    .client(client)
                    .streamTokens(streamTokens)
                    .maxIterations(maxIterations)
                    .build());

            if (result.getOutcome() == IterationOutcome.DONE) {
                return AgentResult.ok(result.getContent());
            }
            if (result.getOutcome() == IterationOutcome.CANCELLED) {
                return AgentResult.fail("cancelled");
            }
            return AgentResult.fail("agent did not converge (" + result.getOutcome() + ")");
        } catch (Exception e) {
            return AgentResult.fail(e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage());
        }
    }

    private String buildUserPrompt(AgentTask task, AgentContext context) {
        return "[OVERALL GOAL]\n" + context.getGoal() + "\n\n"
                + "[YOUR TASK]\n" + task.getGoal() + "\n\n"
                + "[TEAM RESULTS SO FAR]\n" + context.getBlackboard().digest() + "\n\n"
                + "Complete your task and report a concise, factual result.";
    }
}
