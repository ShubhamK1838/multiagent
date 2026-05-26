CREATE TABLE conversation_summaries (
    id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID      NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    summary         TEXT      NOT NULL,
    key_paths       JSONB     NOT NULL DEFAULT '[]',
    key_facts       JSONB     NOT NULL DEFAULT '{}',
    model_used      VARCHAR(100),
    token_count     INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (conversation_id)
);

CREATE INDEX idx_conv_summaries_time ON conversation_summaries(created_at DESC);

INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_secret, created_at, updated_at) VALUES
(gen_random_uuid(), 'memory.enabled',        'true', 'BOOLEAN', 'AGENT', 'Inject past session summaries into system prompt', false, NOW(), NOW()),
(gen_random_uuid(), 'memory.max_summaries',  '5',    'INTEGER', 'AGENT', 'Number of past summaries to inject',               false, NOW(), NOW()),
(gen_random_uuid(), 'memory.min_messages',   '4',    'INTEGER', 'AGENT', 'Minimum conversation messages before summarising',  false, NOW(), NOW()),
(gen_random_uuid(), 'memory.summary_prompt',
 'Summarise this conversation in 3-5 sentences. Extract: (1) file paths the user worked with, (2) tasks completed, (3) any stated preferences. Respond ONLY as JSON: {"summary":"...","key_paths":["..."],"key_facts":{}}',
 'TEXT', 'AGENT', 'Prompt sent to LLM to generate a memory summary', false, NOW(), NOW())
ON CONFLICT DO NOTHING;
