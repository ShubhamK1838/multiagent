-- Conversation search: add a vector embedding column + indexes to messages.
-- Mirrors the pgvector pattern used by document_chunks (see V1__init.sql).

ALTER TABLE messages ADD COLUMN embedding vector(768);

-- Approximate-nearest-neighbour index for semantic search (cosine distance).
CREATE INDEX idx_messages_embedding
    ON messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text index for fast keyword search over message content.
CREATE INDEX idx_messages_content_fts
    ON messages USING gin (to_tsvector('english', content));
