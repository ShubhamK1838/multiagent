package com.aiframework.service;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.domain.entity.ToolExecution;
import com.aiframework.domain.repository.ToolExecutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ToolExecutionLogger {
    private final ToolExecutionRepository repository;

    @Async
    public void record(String toolName, String toolType, UUID toolId, UUID conversationId,
                       Map<String, Object> args, ToolExecutionResult result, long durationMs) {
        try {
            ToolExecution execution = ToolExecution.builder()
                .toolName(toolName)
                .toolType(toolType)
                .toolId(toolId)
                .conversationId(conversationId)
                .inputArgs(args != null ? args : Map.of())
                .resultText(result.isSuccess() ? result.getResult() : null)
                .errorMessage(result.isSuccess() ? null : result.getError())
                .success(result.isSuccess())
                .durationMs(durationMs)
                .build();
            repository.save(execution);
        } catch (Exception e) {
            log.warn("Failed to log tool execution for {}: {}", toolName, e.getMessage());
        }
    }
}
