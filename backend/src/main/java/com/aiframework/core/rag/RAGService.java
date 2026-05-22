package com.aiframework.core.rag;

import com.aiframework.domain.entity.DocumentChunk;
import com.aiframework.domain.entity.RagDocument;
import com.aiframework.domain.repository.DocumentChunkRepository;
import com.aiframework.domain.repository.RagDocumentRepository;
import com.aiframework.service.SettingsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class RAGService {

    private final EmbeddingModel embeddingModel;
    private final DocumentChunkRepository documentChunkRepository;
    private final RagDocumentRepository ragDocumentRepository;
    private final SettingsService settingsService;

    public RAGService(@Qualifier("ollamaEmbeddingModel") EmbeddingModel embeddingModel,
                      DocumentChunkRepository documentChunkRepository,
                      RagDocumentRepository ragDocumentRepository,
                      SettingsService settingsService) {
        this.embeddingModel = embeddingModel;
        this.documentChunkRepository = documentChunkRepository;
        this.ragDocumentRepository = ragDocumentRepository;
        this.settingsService = settingsService;
    }

    public String search(String query) {
        try {
            int topK = settingsService.getInt("rag.top_k", 5);
            float[] embedding = embeddingModel.embed(query);
            List<DocumentChunk> chunks = documentChunkRepository.findSimilarChunks(embedding, topK);

            if (chunks.isEmpty()) {
                return "";
            }

            return chunks.stream()
                    .map(chunk -> "Source: " + chunk.getMetadata().getOrDefault("title", "Unknown") +
                            "\n" + chunk.getContent())
                    .collect(Collectors.joining("\n\n---\n\n"));
        } catch (Exception e) {
            log.warn("RAG search failed: {}", e.getMessage());
            return "";
        }
    }

    @Transactional
    public void ingestDocument(String title, String source, String content) {
        String contentHash = DigestUtils.md5DigestAsHex(content.getBytes(StandardCharsets.UTF_8));
        
        Optional<RagDocument> existing = ragDocumentRepository.findByContentHash(contentHash);
        if (existing.isPresent()) {
            log.info("Document '{}' already exists (hash: {}), skipping ingestion.", title, contentHash);
            return;
        }

        RagDocument document = RagDocument.builder()
                .title(title)
                .source(source)
                .contentHash(contentHash)
                .metadata(java.util.Map.of("title", title, "source", source))
                .build();
        document = ragDocumentRepository.save(document);

        // Chunk the document
        List<String> chunks = chunkText(content, 512, 50);
        
        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            float[] embedding = embeddingModel.embed(chunk);
            DocumentChunk documentChunk = DocumentChunk.builder()
                    .documentId(document.getId())
                    .content(chunk)
                    .embedding(embedding)
                    .chunkIndex(i)
                    .metadata(java.util.Map.of("title", title, "source", source))
                    .build();
            documentChunkRepository.save(documentChunk);
        }
        log.info("Ingested document '{}' as {} chunks", title, chunks.size());
    }

    @Transactional
    public void ingestFile(MultipartFile file, String title, String source) {
        if (title == null || title.isBlank()) {
            title = file.getOriginalFilename();
        }
        if (source == null || source.isBlank()) {
            source = file.getOriginalFilename();
        }

        try (InputStream stream = file.getInputStream()) {
            AutoDetectParser parser = new AutoDetectParser();
            BodyContentHandler handler = new BodyContentHandler(-1); // -1 removes character limit
            Metadata metadata = new Metadata();
            metadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, file.getOriginalFilename());
            ParseContext context = new ParseContext();

            parser.parse(stream, handler, metadata, context);
            String content = handler.toString();

            if (content.isBlank()) {
                throw new RuntimeException("No text could be extracted from the file.");
            }

            ingestDocument(title, source, content);

        } catch (Exception e) {
            log.error("Failed to parse and ingest file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process file: " + e.getMessage());
        }
    }

    private List<String> chunkText(String text, int chunkSize, int overlap) {
        List<String> chunks = new java.util.ArrayList<>();
        String[] words = text.split("\\s+");
        StringBuilder chunk = new StringBuilder();
        int wordCount = 0;

        for (String word : words) {
            chunk.append(word).append(" ");
            wordCount++;
            if (wordCount >= chunkSize) {
                chunks.add(chunk.toString().trim());
                // Keep last 'overlap' words for context continuity
                String[] chunkWords = chunk.toString().trim().split("\\s+");
                chunk = new StringBuilder();
                int start = Math.max(0, chunkWords.length - overlap);
                for (int i = start; i < chunkWords.length; i++) {
                    chunk.append(chunkWords[i]).append(" ");
                }
                wordCount = overlap;
            }
        }
        if (!chunk.toString().isBlank()) {
            chunks.add(chunk.toString().trim());
        }
        return chunks;
    }
}
