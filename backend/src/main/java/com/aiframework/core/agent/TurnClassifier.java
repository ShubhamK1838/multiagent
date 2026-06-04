package com.aiframework.core.agent;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Decides whether a turn is light social "chit-chat" that can be answered instantly by a fast
 * model with no tools, versus a real task that needs the full agent loop.
 *
 * <p>Deliberately conservative: it only returns {@code true} for short, clearly-social input with
 * no sign of an action/lookup request. Anything ambiguous falls through to the normal path, so we
 * never strand a real task on the tool-less fast responder.
 */
@Component
public class TurnClassifier {

    private static final int MAX_CHITCHAT_CHARS = 60;

    // Words that signal a real task (lookups, file/system/data work, actions) — never fast-pathed.
    private static final Pattern TASK_SIGNAL = Pattern.compile(
            "\\b(file|files|folder|directory|path|read|open|list|search|find|run|execute|command|" +
            "code|build|deploy|install|database|db|query|table|system|cpu|memory|disk|process|" +
            "render|chart|graph|table|create|delete|update|write|fetch|download|api|http|" +
            "calculate|compute|analy|summari|translate|generate|email|calendar|schedule)\\b",
            Pattern.CASE_INSENSITIVE);

    // Purely social openers/closers.
    private static final Set<String> SOCIAL = Set.of(
            "hi", "hii", "hey", "hello", "yo", "hiya", "sup",
            "thanks", "thank you", "thx", "ty", "cheers",
            "bye", "goodbye", "good night", "goodnight", "ok", "okay", "cool", "nice",
            "good morning", "good afternoon", "good evening",
            "how are you", "how's it going", "what's up", "whats up", "who are you", "you there",
            "yes", "no", "yep", "nope", "great", "awesome", "lol");

    public boolean isChitchat(String text) {
        if (text == null) return false;
        String t = text.trim().toLowerCase();
        if (t.isEmpty() || t.length() > MAX_CHITCHAT_CHARS) return false;
        if (TASK_SIGNAL.matcher(t).find()) return false;

        String stripped = t.replaceAll("[!?.,]+$", "").trim();
        if (SOCIAL.contains(stripped)) return true;

        // Short greeting-prefixed phrases like "hey jarvis" / "thanks, that's all".
        for (String s : SOCIAL) {
            if (stripped.startsWith(s + " ") || stripped.startsWith(s + ",")) return true;
        }
        return false;
    }
}
