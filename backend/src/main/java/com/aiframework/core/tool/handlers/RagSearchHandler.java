package com.aiframework.core.tool.handlers;

import com.aiframework.core.rag.RAGService;
import com.aiframework.core.tool.ToolExecutionResult;
import com.aiframework.core.tool.ToolHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class RagSearchHandler implements ToolHandler {

    private final RAGService ragService;

    @Override
    public String handlerName() {
        return "rag_search";
    }

    @Override
    public ToolExecutionResult execute(Map<String, Object> args, String conversationId) {
        String query = (String) args.get("query");
        return ToolExecutionResult.success(ragService.search(query));
    }
}
