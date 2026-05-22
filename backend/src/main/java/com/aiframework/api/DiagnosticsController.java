package com.aiframework.api;

import com.aiframework.service.monitoring.DiagnosticsService;
import com.aiframework.service.monitoring.LogStreamService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.Map;

@RestController
@RequestMapping("/api/diagnostics")
public class DiagnosticsController {

    private final DiagnosticsService diagnosticsService;
    private final LogStreamService logStreamService;

    public DiagnosticsController(DiagnosticsService diagnosticsService, LogStreamService logStreamService) {
        this.diagnosticsService = diagnosticsService;
        this.logStreamService = logStreamService;
    }

    @GetMapping("/health")
    public Map<String, Object> getHealth() {
        return diagnosticsService.getSystemHealth();
    }

    @GetMapping(value = "/logs", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamLogs() {
        return logStreamService.streamMatrixLogs();
    }
}
