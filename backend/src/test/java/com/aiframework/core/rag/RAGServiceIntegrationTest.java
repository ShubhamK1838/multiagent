package com.aiframework.core.rag;

import com.aiframework.domain.entity.RagDocument;
import com.aiframework.domain.repository.DocumentChunkRepository;
import com.aiframework.domain.repository.RagDocumentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
public class RAGServiceIntegrationTest {

    @Autowired
    private RAGService ragService;

    @Autowired
    private RagDocumentRepository ragDocumentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @AfterEach
    public void cleanup() {
        documentChunkRepository.deleteAll();
        ragDocumentRepository.deleteAll();
    }

    @Test
    public void testIngestAndSearch_RealDB() {
        // 1. Define test document
        String title = "Test Knowledge Document";
        String source = "integration_test";
        String content = "The sky is blue because of Rayleigh scattering. This phenomenon scatters shorter wavelengths of light more efficiently than longer ones.";

        // 2. Ingest document
        ragService.ingestDocument(title, source, content);

        // 3. Verify it was saved in the database
        List<RagDocument> documents = ragDocumentRepository.findAll();
        Assertions.assertEquals(1, documents.size(), "Should have exactly one document in the DB");
        RagDocument savedDoc = documents.get(0);
        Assertions.assertEquals(title, savedDoc.getTitle());
        
        long chunkCount = documentChunkRepository.count();
        Assertions.assertTrue(chunkCount > 0, "Document should be chunked and saved");

        // 4. Perform search
        String searchQuery = "Why is the sky blue?";
        String searchResult = ragService.search(searchQuery);

        // 5. Verify the search results
        Assertions.assertNotNull(searchResult, "Search result should not be null");
        Assertions.assertTrue(searchResult.contains(title), "Result should contain the document title");
        Assertions.assertTrue(searchResult.contains("Rayleigh scattering"), "Result should contain the relevant context");
    }
    
    @Test
    public void testDuplicateIngestionIsIgnored() {
        String title = "Duplicate Test";
        String source = "test";
        String content = "This is a document that will be ingested twice.";

        // First ingestion
        ragService.ingestDocument(title, source, content);
        long initialDocCount = ragDocumentRepository.count();
        long initialChunkCount = documentChunkRepository.count();
        
        // Second ingestion with identical content
        ragService.ingestDocument(title, source, content);
        
        Assertions.assertEquals(initialDocCount, ragDocumentRepository.count(), "Duplicate document should not be inserted");
        Assertions.assertEquals(initialChunkCount, documentChunkRepository.count(), "Duplicate chunks should not be inserted");
    }
}
