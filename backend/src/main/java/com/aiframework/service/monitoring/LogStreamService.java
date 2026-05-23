package com.aiframework.service.monitoring;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;

import jakarta.annotation.PostConstruct;

@Service
public class LogStreamService {

    public Flux<String> streamMatrixLogs() {
        return Flux.create(sink -> {
            java.util.function.Consumer<String> listener = message -> {
                sink.next(message);
            };
            SseLogbackAppender.addListener(listener);
            sink.onDispose(() -> SseLogbackAppender.removeListener(listener));
        }, FluxSink.OverflowStrategy.BUFFER);
    }
}
