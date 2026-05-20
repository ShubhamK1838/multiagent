-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- System settings: key-value store for all configuration
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) NOT NULL DEFAULT 'STRING',
    category VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
    description TEXT,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tool definitions: dynamically registered tools
CREATE TABLE tool_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    parameters_schema JSONB NOT NULL DEFAULT '{}',
    tool_type VARCHAR(50) NOT NULL,
    handler_config JSONB NOT NULL DEFAULT '{}',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    requires_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500),
    system_prompt TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Messages in conversations
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    tool_calls JSONB,
    tool_results JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- RAG documents
CREATE TABLE rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    source VARCHAR(1000),
    content_hash VARCHAR(64) NOT NULL UNIQUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Document chunks with vector embeddings
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Form requests: when AI needs user input
CREATE TABLE form_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    schema JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    response JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Agent events: audit log
CREATE TABLE agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_events_conversation ON agent_events(conversation_id);
CREATE INDEX idx_tool_definitions_name ON tool_definitions(name);

-- Default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('llm.provider', 'openai', 'STRING', 'LLM', 'LLM provider: openai or ollama'),
('llm.model', 'gpt-4o', 'STRING', 'LLM', 'Model name'),
('llm.temperature', '0.7', 'DECIMAL', 'LLM', 'Temperature (0.0-2.0)'),
('llm.max_tokens', '4096', 'INTEGER', 'LLM', 'Max tokens per response'),
('llm.system_prompt', 'You are a highly capable AI assistant with access to various tools. Think step by step, use tools when needed, and always provide clear reasoning for your actions. When you need additional information from the user, request it via a structured form. You can chain multiple tool calls to accomplish complex tasks.', 'TEXT', 'LLM', 'Global system prompt'),
('rag.enabled', 'true', 'BOOLEAN', 'RAG', 'Enable RAG context injection'),
('rag.top_k', '5', 'INTEGER', 'RAG', 'Number of chunks to retrieve'),
('rag.similarity_threshold', '0.7', 'DECIMAL', 'RAG', 'Minimum similarity score'),
('agent.max_iterations', '10', 'INTEGER', 'AGENT', 'Max tool chaining iterations'),
('agent.stream_thinking', 'true', 'BOOLEAN', 'AGENT', 'Stream reasoning steps to frontend'),
('embedding.model', 'nomic-embed-text', 'STRING', 'RAG', 'Ollama embedding model');

-- Default built-in tools
INSERT INTO tool_definitions (name, description, parameters_schema, tool_type, handler_config) VALUES
('web_search', 'Search the web for current information', '{"type":"object","properties":{"query":{"type":"string","description":"Search query"}},"required":["query"]}', 'HTTP', '{"url":"https://api.duckduckgo.com/","method":"GET","queryParams":{"q":"${query}","format":"json"}}'),
('calculator', 'Evaluate mathematical expressions', '{"type":"object","properties":{"expression":{"type":"string","description":"Math expression to evaluate"}},"required":["expression"]}', 'BUILTIN', '{"handler":"calculator"}'),
('rag_search', 'Search internal knowledge base', '{"type":"object","properties":{"query":{"type":"string","description":"Search query for knowledge base"}},"required":["query"]}', 'BUILTIN', '{"handler":"rag_search"}'),
('ask_user', 'Request additional information from the user via a dynamic form', '{"type":"object","properties":{"form_schema":{"type":"object","description":"JSON Schema for the form to display to user"},"reason":{"type":"string","description":"Why you need this information"}},"required":["form_schema","reason"]}', 'BUILTIN', '{"handler":"ask_user"}');
