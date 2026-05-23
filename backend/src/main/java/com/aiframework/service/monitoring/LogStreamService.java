package com.aiframework.service.monitoring;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Service
public class LogStreamService {

    private static final int RING_BUFFER_SIZE = 100;
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("HH:mm:ss.SSS").withZone(ZoneId.systemDefault());

    private final Sinks.Many<String> sink = Sinks.many().multicast().onBackpressureBuffer(256, false);
    private final Deque<String> ringBuffer = new ArrayDeque<>(RING_BUFFER_SIZE);

    /**
     * Publish a real log line. Called by tool execution, agent orchestrator, etc.
     */
    public synchronized void publishLog(String level, String source, String message) {
        String timestamp = FMT.format(Instant.now());
        String line = String.format("[%s] [%s] [%s] %s", timestamp, level, source, message);
        // Maintain ring buffer for late subscribers
        if (ringBuffer.size() >= RING_BUFFER_SIZE) {
            ringBuffer.pollFirst();
        }
        ringBuffer.addLast(line);
        sink.tryEmitNext(line);
    }

    /**
     * Shorthand helpers
     */
    public void info(String source, String message)  { publishLog("INFO",  source, message); }
    public void warn(String source, String message)  { publishLog("WARN",  source, message); }
    public void error(String source, String message) { publishLog("ERROR", source, message); }
    public void tool(String source, String message)  { publishLog("TOOL",  source, message); }
    public void agent(String source, String message) { publishLog("AGENT", source, message); }

    /**
     * Returns a Flux that first replays the ring buffer, then follows live.
     */
    public Flux<String> streamMatrixLogs() {
        List<String> snapshot;
        synchronized (this) {
            snapshot = new ArrayList<>(ringBuffer);
        }
        return Flux.concat(Flux.fromIterable(snapshot), sink.asFlux());
    }
}
