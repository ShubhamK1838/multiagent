CREATE TABLE tool_executions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id         UUID REFERENCES tool_definitions(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    tool_name       VARCHAR(255) NOT NULL,
    tool_type       VARCHAR(50)  NOT NULL,
    input_args      JSONB        NOT NULL DEFAULT '{}',
    result_text     TEXT,
    error_message   TEXT,
    success         BOOLEAN      NOT NULL DEFAULT FALSE,
    duration_ms     BIGINT,
    executed_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_executions_tool_id   ON tool_executions(tool_id);
CREATE INDEX idx_tool_executions_conv_id   ON tool_executions(conversation_id);
CREATE INDEX idx_tool_executions_executed  ON tool_executions(executed_at DESC);
CREATE INDEX idx_tool_executions_tool_name ON tool_executions(tool_name);
