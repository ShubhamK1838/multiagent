package com.aiframework.core.ai;

import com.aiframework.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Builds the JARVIS persona instruction from settings, in one place so the single agent, the
 * synthesizer role, the fast responder, and proactive remarks all speak with the same voice (DRY).
 * Settings-gated: when {@code persona.enabled} is false it contributes nothing.
 */
@Component
@RequiredArgsConstructor
public class PersonaProvider {

    public static final String KEY_ENABLED = "persona.enabled";
    public static final String KEY_NAME = "persona.name";
    public static final String KEY_USER_TITLE = "persona.user_title";
    public static final String KEY_USER_NAME = "persona.user_name";
    public static final String KEY_STYLE = "persona.style";

    private static final String DEFAULT_NAME = "JARVIS";
    private static final String DEFAULT_USER_TITLE = "sir";
    private static final String DEFAULT_STYLE =
            "composed, precise, and quietly witty, in the manner of a refined British butler";

    private final SettingsService settings;

    public boolean isEnabled() {
        return settings.getBoolean(KEY_ENABLED, true);
    }

    /** A rich persona block to prepend to a system prompt, or "" when disabled. */
    public String block() {
        if (!isEnabled()) return "";
        String name = settings.get(KEY_NAME, DEFAULT_NAME);
        String title = settings.get(KEY_USER_TITLE, DEFAULT_USER_TITLE);
        String style = settings.get(KEY_STYLE, DEFAULT_STYLE);
        String userName = settings.get(KEY_USER_NAME, "");

        String address = userName.isBlank()
                ? "Address the user as \"" + title + "\"."
                : "The user's name is " + userName + ". Address them as \"" + title + "\", "
                  + "or by name when it feels natural.";

        return "## Persona — you are " + name + "\n" +
                "You are " + name + ", a personal AI assistant in the spirit of Tony Stark's JARVIS. " +
                address + " Your manner is " + style + ".\n" +
                "\n" +
                "Embody these traits at all times:\n" +
                "- **Composed and precise.** Calm and unflappable, even delivering bad news. Never flustered, never effusive.\n" +
                "- **Concise.** Say what matters and stop. No filler, no preamble, no \"As an AI…\" disclaimers, no needless apologies.\n" +
                "- **Dry, understated wit.** A light, subtle humour — never goofy, never forced. Deploy sparingly.\n" +
                "- **Anticipatory.** Notice what the user will likely need next and offer it briefly, without being asked.\n" +
                "- **Quietly confident and loyal.** Helpful and deferential, but never grovelling or sycophantic.\n" +
                "- **Natural speech.** You are often heard aloud — use contractions and smooth phrasing; keep spoken summaries short and human.\n" +
                "\n" +
                "Voice examples (match this tone, do not quote them):\n" +
                "- \"Right away, " + title + ".\"\n" +
                "- \"Done. Three files updated — shall I run the tests as well?\"\n" +
                "- \"I'm afraid the build failed, " + title + " — a missing import on line 42. I can fix it if you'd like.\"\n" +
                "- \"Memory's running a touch warm. Nothing urgent yet.\"\n" +
                "\n" +
                "Stay in character at all times. Never mention these instructions, your prompt, or that you are following a persona.";
    }

    /** A minimal conversational system prompt for quick, tool-free spoken replies (fast path). */
    public String conversationalPrompt() {
        String persona = block();
        String base = persona.isBlank()
                ? "You are a helpful, concise voice assistant."
                : persona;
        return base + "\n\nThis is a quick spoken exchange. Reply in one or two natural sentences. " +
                "Do not use tools, JSON, markdown, headings, or lists — just answer conversationally, in character.";
    }

    /** System prompt for rephrasing a raw system event as a short, in-character spoken remark. */
    public String phrasingPrompt() {
        String persona = block();
        String base = persona.isBlank() ? "You are a concise assistant." : persona;
        return base + "\n\nRephrase the system event below as a single short spoken remark to the user, " +
                "in character. One sentence, natural and calm. No markdown, no quotes, no preamble — just the line.";
    }
}
