package com.aiframework.core.tool.handlers;

import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class GetSystemInfoHandler implements ToolHandler {

    private final ObjectMapper objectMapper;

    @Override
    public String handlerName() {
        return "get_system_info";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        try {
            OperatingSystemMXBean os = ManagementFactory.getOperatingSystemMXBean();
            MemoryMXBean memory = ManagementFactory.getMemoryMXBean();
            Runtime runtime = Runtime.getRuntime();

            Map<String, Object> info = new LinkedHashMap<>();
            info.put("os", System.getProperty("os.name"));
            info.put("osVersion", System.getProperty("os.version"));
            info.put("architecture", System.getProperty("os.arch"));
            info.put("javaVersion", System.getProperty("java.version"));
            info.put("username", System.getProperty("user.name"));
            info.put("userHome", System.getProperty("user.home"));
            info.put("processors", runtime.availableProcessors());
            info.put("totalMemoryMB", runtime.totalMemory() / 1_048_576);
            info.put("freeMemoryMB", runtime.freeMemory() / 1_048_576);
            info.put("maxMemoryMB", runtime.maxMemory() / 1_048_576);
            info.put("heapUsedMB", memory.getHeapMemoryUsage().getUsed() / 1_048_576);
            info.put("systemLoadAverage", os.getSystemLoadAverage());

            return ToolExecutionResult.success(objectMapper.writeValueAsString(info));
        } catch (Exception e) {
            return ToolExecutionResult.error("Failed to get system info: " + e.getMessage());
        }
    }
}
