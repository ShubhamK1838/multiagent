package com.aiframework.service.ai;

import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.List;

@Service
public class BasicDocumentService implements DocumentService {

    @Override
    public String summarize(String documentContent) {
        if (documentContent == null || documentContent.isEmpty()) {
            return "No content to summarize.";
        }
        return "Summary: " + documentContent.substring(0, Math.min(documentContent.length(), 100)) + "...";
    }

    @Override
    public void indexDocument(String documentId, String content) {
        // Placeholder for pgvector integration
        System.out.println("Indexing document: " + documentId);
    }

    @Override
    public List<String> semanticSearch(String query) {
        // Placeholder for pgvector search
        return Collections.singletonList("Simulated semantic result for: " + query);
    }
}
