package com.aiframework.core.agent;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TurnClassifierTest {

    private final TurnClassifier classifier = new TurnClassifier();

    @Test
    void recognisesSocialTurns() {
        assertTrue(classifier.isChitchat("hi"));
        assertTrue(classifier.isChitchat("Hello!"));
        assertTrue(classifier.isChitchat("hey jarvis"));
        assertTrue(classifier.isChitchat("thanks, that was helpful"));
        assertTrue(classifier.isChitchat("how are you?"));
    }

    @Test
    void rejectsRealTasks() {
        assertFalse(classifier.isChitchat("list the files in my home folder"));
        assertFalse(classifier.isChitchat("run the build and show me errors"));
        assertFalse(classifier.isChitchat("search the database for users"));
        assertFalse(classifier.isChitchat("summarize this document"));
    }

    @Test
    void rejectsLongOrEmptyInput() {
        assertFalse(classifier.isChitchat(""));
        assertFalse(classifier.isChitchat(null));
        assertFalse(classifier.isChitchat("hello ".repeat(20)));
    }
}
