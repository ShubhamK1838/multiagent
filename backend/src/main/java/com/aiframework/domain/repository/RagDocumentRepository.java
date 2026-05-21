package com.aiframework.domain.repository;

import com.aiframework.domain.entity.RagDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RagDocumentRepository extends JpaRepository<RagDocument, UUID> {
    Optional<RagDocument> findByContentHash(String contentHash);
}
