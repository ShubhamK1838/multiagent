CREATE TABLE workflows (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    run_count   INTEGER      NOT NULL DEFAULT 0,
    last_run_at TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_steps (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID    NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order  INTEGER NOT NULL,
    tool_name   VARCHAR(255) NOT NULL,
    tool_args   JSONB        NOT NULL DEFAULT '{}',
    UNIQUE (workflow_id, step_order)
);

CREATE INDEX idx_workflow_steps_wf ON workflow_steps(workflow_id);

INSERT INTO tool_definitions (name, description, parameters_schema, tool_type, handler_config) VALUES
(
  'save_workflow',
  'Save a sequence of tool calls as a named replayable workflow. Call this after completing a multi-step task to record it for future use.',
  '{"type":"object","properties":{"name":{"type":"string"},"description":{"type":"string"},"steps":{"type":"array","items":{"type":"object","properties":{"tool_name":{"type":"string"},"tool_args":{"type":"object"}},"required":["tool_name","tool_args"]}}},"required":["name","steps"]}',
  'BUILTIN', '{"handler":"save_workflow"}'
),
(
  'run_workflow',
  'Replay a saved workflow by name, executing each step in sequence.',
  '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}',
  'BUILTIN', '{"handler":"run_workflow"}'
),
(
  'list_workflows',
  'List all saved workflows with names, descriptions, and step counts.',
  '{"type":"object","properties":{}}',
  'BUILTIN', '{"handler":"list_workflows"}'
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  parameters_schema = EXCLUDED.parameters_schema;
