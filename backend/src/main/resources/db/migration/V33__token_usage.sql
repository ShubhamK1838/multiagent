-- Token & cost tracking: one row per LLM completion. Mirrors tool_executions (V10).

CREATE TABLE token_usage (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id   UUID REFERENCES conversations(id) ON DELETE SET NULL,
    message_id        UUID,
    model_id          UUID,
    model_name        VARCHAR(255),
    provider          VARCHAR(50),
    prompt_tokens     INTEGER       NOT NULL DEFAULT 0,
    completion_tokens INTEGER       NOT NULL DEFAULT 0,
    total_tokens      INTEGER       NOT NULL DEFAULT 0,
    input_cost        NUMERIC(12,6) NOT NULL DEFAULT 0,
    output_cost       NUMERIC(12,6) NOT NULL DEFAULT 0,
    total_cost        NUMERIC(12,6) NOT NULL DEFAULT 0,
    estimated         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_token_usage_conversation_id ON token_usage(conversation_id);
CREATE INDEX idx_token_usage_created_at       ON token_usage(created_at DESC);
CREATE INDEX idx_token_usage_model_name       ON token_usage(model_name);
