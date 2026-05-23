package com.aiframework.service.ai;

import org.springframework.stereotype.Service;
import com.aiframework.service.aimodel.ChatClientProvider;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Collections;
import java.util.List;

@Service
public class BasicDocumentService implements DocumentService {

    private static final Logger log = LoggerFactory.getLogger(BasicDocumentService.class);
    private final ChatClientProvider chatClientProvider;

    public BasicDocumentService(ChatClientProvider chatClientProvider) {
        this.chatClientProvider = chatClientProvider;
    }

    @Override
    public String summarize(String documentContent) {
        if (documentContent == null || documentContent.isEmpty()) {
            return "No content to summarize.";
        }

        try {
            ChatClient client = chatClientProvider.getDefault();
            String prompt = "Provide a concise summary of the following document:\n\n" + documentContent;
            String response = client.prompt()
                .messages(new UserMessage(prompt))
                .call()
                .content();

            if (response != null && !response.trim().isEmpty()) {
                return response.trim();
            }
        } catch (Exception e) {
            log.warn("Document summarization failed, falling back to basic summarization: {}", e.getMessage());
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
