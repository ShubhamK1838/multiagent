package com.aiframework.api;

import com.aiframework.domain.entity.ToolExecution;
import com.aiframework.domain.repository.ToolExecutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tools")
@RequiredArgsConstructor
public class ToolExecutionController {
    private final ToolExecutionRepository repository;

    @GetMapping("/executions")
    public List<ToolExecution> listRecent(@RequestParam(defaultValue = "50") int limit) {
        return repository.findAllByOrderByExecutedAtDesc(PageRequest.of(0, Math.min(limit, 200)));
    }

    @GetMapping("/{toolName}/executions")
    public List<ToolExecution> byTool(@PathVariable String toolName,
                                      @RequestParam(defaultValue = "20") int limit) {
        return repository.findByToolNameOrderByExecutedAtDesc(toolName, PageRequest.of(0, limit));
    }
}
