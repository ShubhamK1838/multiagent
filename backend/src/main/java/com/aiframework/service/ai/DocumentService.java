package com.aiframework.service.ai;

public interface DocumentService {
    String summarize(String documentContent);
    void indexDocument(String documentId, String content);
    java.util.List<String> semanticSearch(String query);
}
