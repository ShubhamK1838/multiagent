package com.aiframework.service.monitoring;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import java.time.Duration;
import java.time.Instant;

@Service
public class LogStreamService {

    public Flux<String> streamMatrixLogs() {
        // Simulates continuous system logs for the matrix-style UI
        return Flux.interval(Duration.ofMillis(200))
                   .map(seq -> String.format("[%s] SYSTEM_SEQ_%d: Packet routing complete across sector 7G", Instant.now().toString(), seq));
    }
}
