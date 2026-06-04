package com.aiframework.core.agent;

import com.aiframework.core.agent.multi.MultiAgentSettings;
import com.aiframework.service.SettingsService;
import org.springframework.ai.chat.messages.Message;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Routes each turn to the active {@link ConversationRunner}: the multi-agent team when
 * {@code agent.multi.enabled} is on, otherwise the single agent. The HTTP layer depends on this
 * dispatcher rather than on a concrete runner (DIP), so the execution mode is configuration.
 *
 * <p>Runners are injected <em>by interface</em> (with a qualifier) on purpose: both runners expose
 * {@code @Async} methods, so Spring wraps each in a JDK dynamic proxy that implements
 * {@link ConversationRunner} but is not assignable to the concrete class.
 */
@Component
public class AgentRunnerDispatcher {

    private final ConversationRunner singleAgentRunner;
    private final ConversationRunner multiAgentRunner;
    private final MultiAgentSettings multiAgentSettings;
    private final TurnClassifier turnClassifier;
    private final FastResponder fastResponder;
    private final SettingsService settings;

    public AgentRunnerDispatcher(@Qualifier("agentOrchestrator") ConversationRunner singleAgentRunner,
                                 @Qualifier("multiAgentRunner") ConversationRunner multiAgentRunner,
                                 MultiAgentSettings multiAgentSettings,
                                 TurnClassifier turnClassifier,
                                 FastResponder fastResponder,
                                 SettingsService settings) {
        this.singleAgentRunner = singleAgentRunner;
        this.multiAgentRunner = multiAgentRunner;
        this.multiAgentSettings = multiAgentSettings;
        this.turnClassifier = turnClassifier;
        this.fastResponder = fastResponder;
        this.settings = settings;
    }

    public void run(String conversationId, List<Message> history, String userMessage, String imageBase64) {
        // Fast path: light social turns (no image) answered instantly, tool-free.
        boolean fastPathEnabled = settings.getBoolean("agent.fastpath.enabled", true);
        if (fastPathEnabled && imageBase64 == null && turnClassifier.isChitchat(userMessage)) {
            fastResponder.run(conversationId, history, userMessage);
            return;
        }
        ConversationRunner runner = multiAgentSettings.isEnabled() ? multiAgentRunner : singleAgentRunner;
        runner.run(conversationId, history, userMessage, imageBase64);
    }
}
