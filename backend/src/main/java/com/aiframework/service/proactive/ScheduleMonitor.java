package com.aiframework.service.proactive;

import com.aiframework.service.SettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

/**
 * Time-aware proactivity: emits a single in-character greeting when the day crosses into a new
 * part (morning / afternoon / evening / night), so JARVIS feels present rather than purely
 * reactive. Fires at most a few times a day and only while proactive mode + an active
 * conversation exist (enforced by {@link ProactiveAlertPublisher}).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduleMonitor {

    private final ProactiveAlertPublisher alertPublisher;
    private final SettingsService settingsService;

    private volatile String lastBand = null;

    @Scheduled(fixedDelay = 15 * 60 * 1000)
    public void checkTimeOfDay() {
        if (!settingsService.getBoolean("proactive.enabled", false)) return;
        if (!settingsService.getBoolean("proactive.schedule.enabled", true)) return;

        String band = bandFor(LocalTime.now());
        if (band.equals(lastBand)) return; // only on transition
        lastBand = band;

        alertPublisher.publish("schedule_greeting", greetingFor(band));
    }

    private String bandFor(LocalTime now) {
        int h = now.getHour();
        if (h < 5) return "night";
        if (h < 12) return "morning";
        if (h < 17) return "afternoon";
        if (h < 22) return "evening";
        return "night";
    }

    private String greetingFor(String band) {
        return switch (band) {
            case "morning"   -> "Good morning. Standing by whenever you need me.";
            case "afternoon" -> "Good afternoon. Let me know how I can help.";
            case "evening"   -> "Good evening. I'm here if you need anything.";
            default          -> "It's getting late. I'll be here whenever you need me.";
        };
    }
}
