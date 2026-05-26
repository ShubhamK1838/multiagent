package com.aiframework.core.tool;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class ToolHandlerRegistry {

    private final Map<String, ToolHandler> handlers;

    public ToolHandlerRegistry(List<ToolHandler> handlers) {
        this.handlers = handlers.stream()
                .collect(Collectors.toMap(ToolHandler::handlerName, Function.identity()));
        log.info("Registered {} tool handler(s): {}", this.handlers.size(), this.handlers.keySet());
    }

    public ToolHandler get(String name) {
        ToolHandler handler = handlers.get(name);
        if (handler == null) {
            throw new IllegalArgumentException("No handler registered for: " + name);
        }
        return handler;
    }
}
