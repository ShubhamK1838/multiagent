package com.aiframework.service.monitoring;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import ch.qos.logback.core.encoder.Encoder;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

public class SseLogbackAppender extends AppenderBase<ILoggingEvent> {

    private Encoder<ILoggingEvent> encoder;
    private static final List<Consumer<String>> listeners = new ArrayList<>();

    public static void addListener(Consumer<String> listener) {
        listeners.add(listener);
    }

    public static void removeListener(Consumer<String> listener) {
        listeners.remove(listener);
    }

    @Override
    protected void append(ILoggingEvent eventObject) {
        if (encoder == null) {
            return;
        }
        try {
            byte[] byteArray = encoder.encode(eventObject);
            String message = new String(byteArray);
            for (Consumer<String> listener : listeners) {
                try {
                    listener.accept(message);
                } catch (Exception e) {
                    // Ignore listener exceptions
                }
            }
        } catch (Exception e) {
            // Ignore encoding errors
        }
    }

    public Encoder<ILoggingEvent> getEncoder() {
        return encoder;
    }

    public void setEncoder(Encoder<ILoggingEvent> encoder) {
        this.encoder = encoder;
    }
}
