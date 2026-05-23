package com.aiframework.service.monitoring;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

@Service
public class ActiveOperationsTracker {

    private final Map<String, OperationStatus> activeOperations = new ConcurrentHashMap<>();
    private final Sinks.Many<OperationUpdate> operationsSink = Sinks.many().multicast().onBackpressureBuffer();

    public record OperationStatus(String id, String toolName, String status, String progressMessage) {}
    public record OperationUpdate(String type, OperationStatus operation) {}

    public String startOperation(String toolName, String args) {
        String id = UUID.randomUUID().toString();
        OperationStatus op = new OperationStatus(id, toolName, "RUNNING", "Started with args: " + args);
        activeOperations.put(id, op);
        operationsSink.tryEmitNext(new OperationUpdate("ADDED", op));
        return id;
    }

    public void updateOperation(String id, String status, String progressMessage) {
        if (activeOperations.containsKey(id)) {
            OperationStatus existing = activeOperations.get(id);
            OperationStatus updated = new OperationStatus(id, existing.toolName(), status, progressMessage);
            activeOperations.put(id, updated);
            operationsSink.tryEmitNext(new OperationUpdate("UPDATED", updated));
        }
    }

    public void completeOperation(String id, boolean success, String result) {
        if (activeOperations.containsKey(id)) {
            OperationStatus existing = activeOperations.remove(id);
            String finalStatus = success ? "COMPLETED" : "FAILED";
            OperationStatus updated = new OperationStatus(id, existing.toolName(), finalStatus, result);
            operationsSink.tryEmitNext(new OperationUpdate("REMOVED", updated));
        }
    }

    public Flux<OperationUpdate> streamOperations() {
        return operationsSink.asFlux();
    }

    public Map<String, OperationStatus> getActiveOperations() {
        return activeOperations;
    }
}
