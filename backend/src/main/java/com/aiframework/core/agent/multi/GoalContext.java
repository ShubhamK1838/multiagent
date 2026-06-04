package com.aiframework.core.agent.multi;

import org.springframework.ai.chat.messages.Message;

import java.util.List;

/**
 * The input to a multi-agent run: the conversation, the user's goal, and prior history.
 *
 * @param conversationId conversation being served
 * @param userMessage    the user's goal for this turn
 * @param history        pruned prior messages (may be empty)
 */
public record GoalContext(String conversationId, String userMessage, List<Message> history) {
}
