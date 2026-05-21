package com.aiframework.core.tool.strategy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class ToolExecutionStrategyRegistry {
    private final Map<String, ToolExecutionStrategy> strategies;

    public ToolExecutionStrategyRegistry(List<ToolExecutionStrategy> strategyList) {
        this.strategies = strategyList.stream()
            .collect(Collectors.toMap(ToolExecutionStrategy::toolType, Function.identity()));
        log.info("Registered tool execution strategies: {}", strategies.keySet());
    }

    public ToolExecutionStrategy get(String toolType) {
        ToolExecutionStrategy strategy = strategies.get(toolType);
        if (strategy == null) {
            throw new IllegalArgumentException("No execution strategy for tool type: " + toolType);
        }
        return strategy;
    }

    public boolean supports(String toolType) {
        return strategies.containsKey(toolType);
    }
}
