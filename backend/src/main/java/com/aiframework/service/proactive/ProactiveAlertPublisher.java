package com.aiframework.service.proactive;

import com.aiframework.core.event.EventBus;
import com.aiframework.service.SettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProactiveAlertPublisher {

    private final EventBus eventBus;
    private final SettingsService settingsService;
    private final ActiveConversationTracker conversationTracker;

    // Maps alert-type key → last publish time for cooldown enforcement
    private final ConcurrentMap<String, Instant> lastPublished = new ConcurrentHashMap<>();

    public void publish(String alertType, String message) {
        if (!settingsService.getBoolean("proactive.enabled", false)) return;

        String conversationId = conversationTracker.getActive();
        if (conversationId == null) {
            log.debug("No active conversation for proactive alert type={}", alertType);
            return;
        }

        if (isCoolingDown(alertType)) {
            log.debug("Proactive alert suppressed by cooldown: type={}", alertType);
            return;
        }

        lastPublished.put(alertType, Instant.now());
        log.info("Proactive alert: type={} conv={}", alertType, conversationId.substring(0, 8));
        eventBus.publishProactiveAlert(conversationId, message);
    }

    private boolean isCoolingDown(String alertType) {
        Instant last = lastPublished.get(alertType);
        if (last == null) return false;
        int cooldownSeconds = settingsService.getInt("proactive.cooldown_seconds", 60);
        return Instant.now().isBefore(last.plusSeconds(cooldownSeconds));
    }
}
