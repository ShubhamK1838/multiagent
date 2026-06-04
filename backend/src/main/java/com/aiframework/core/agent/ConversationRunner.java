package com.aiframework.core.agent;

import org.springframework.ai.chat.messages.Message;

import java.util.List;

/**
 * Drives a single user turn to completion for a conversation.
 *
 * <p>Implementations are interchangeable (LSP): {@link AgentOrchestrator} runs a single agent,
 * while the multi-agent runner coordinates a team of agents. {@link AgentRunnerDispatcher}
 * selects the active implementation per request based on configuration.
 */
public interface ConversationRunner {

    /**
     * Executes the turn asynchronously, publishing progress via the event bus.
     *
     * @param conversationId the conversation being served
     * @param history        pruned prior messages (excluding the current request)
     * @param userMessage    the current user request
     * @param imageBase64    optional inline image, or {@code null}
     */
    void run(String conversationId, List<Message> history, String userMessage, String imageBase64);
}
