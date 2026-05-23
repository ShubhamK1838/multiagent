package com.aiframework.api;

import com.aiframework.service.ConversationService;
import com.aiframework.service.monitoring.ActiveOperationsTracker;
import com.aiframework.service.monitoring.DiagnosticsService;
import com.aiframework.service.monitoring.LogStreamService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.lang.management.ManagementFactory;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/diagnostics")
public class DiagnosticsController {

    private final DiagnosticsService diagnosticsService;
    private final LogStreamService logStreamService;
    private final ActiveOperationsTracker activeOperationsTracker;
    private final ConversationService conversationService;
    private final long startTimeMs = System.currentTimeMillis();

    public DiagnosticsController(DiagnosticsService diagnosticsService,
                                  LogStreamService logStreamService,
                                  ActiveOperationsTracker activeOperationsTracker,
                                  ConversationService conversationService) {
        this.diagnosticsService = diagnosticsService;
        this.logStreamService = logStreamService;
        this.activeOperationsTracker = activeOperationsTracker;
        this.conversationService = conversationService;
    }

    @GetMapping("/health")
    public Map<String, Object> getHealth() {
        return diagnosticsService.getSystemHealth();
    }

    @GetMapping(value = "/logs", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamLogs() {
        return logStreamService.streamMatrixLogs();
    }

    @GetMapping(value = "/operations/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<ActiveOperationsTracker.OperationUpdate>> streamOperations() {
        Flux<ServerSentEvent<ActiveOperationsTracker.OperationUpdate>> keepAlive = Flux.interval(Duration.ofSeconds(15))
            .map(tick -> ServerSentEvent.<ActiveOperationsTracker.OperationUpdate>builder()
                .comment("keep-alive")
                .build());

        Flux<ServerSentEvent<ActiveOperationsTracker.OperationUpdate>> dataStream = activeOperationsTracker.streamOperations()
            .map(update -> ServerSentEvent.<ActiveOperationsTracker.OperationUpdate>builder()
                .event(update.type())
                .data(update)
                .build());

        return Flux.merge(keepAlive, dataStream);
    }

    /**
     * Real system stats for the HUD ticker tape.
     */
    @GetMapping("/ticker")
    public Map<String, Object> getTicker() {
        long uptimeMs = System.currentTimeMillis() - startTimeMs;
        long uptimeSec = uptimeMs / 1000;
        long hours = uptimeSec / 3600;
        long mins = (uptimeSec % 3600) / 60;
        long secs = uptimeSec % 60;

        int activeConversations;
        try {
            activeConversations = conversationService.listConversations().size();
        } catch (Exception e) {
            activeConversations = 0;
        }

        int activeOps = activeOperationsTracker.getActiveOperations().size();

        Runtime rt = Runtime.getRuntime();
        long usedMb = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);

        Map<String, Object> ticker = new LinkedHashMap<>();
        ticker.put("uptime", String.format("%02d:%02d:%02d", hours, mins, secs));
        ticker.put("activeConversations", activeConversations);
        ticker.put("activeOperations", activeOps);
        ticker.put("jvmHeapMb", usedMb);
        ticker.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        ticker.put("jvmUptime", ManagementFactory.getRuntimeMXBean().getUptime());
        return ticker;
    }
}


