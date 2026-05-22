package com.aiframework.api;

import com.aiframework.service.monitoring.ActiveOperationsTracker;
import com.aiframework.service.monitoring.DiagnosticsService;
import com.aiframework.service.monitoring.LogStreamService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/diagnostics")
public class DiagnosticsController {

    private final DiagnosticsService diagnosticsService;
    private final LogStreamService logStreamService;
    private final ActiveOperationsTracker activeOperationsTracker;

    public DiagnosticsController(DiagnosticsService diagnosticsService, LogStreamService logStreamService, ActiveOperationsTracker activeOperationsTracker) {
        this.diagnosticsService = diagnosticsService;
        this.logStreamService = logStreamService;
        this.activeOperationsTracker = activeOperationsTracker;
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
}
