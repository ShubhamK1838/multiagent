-- Multi-agent team: configurable agent roles for the orchestrator-worker topology.
-- Each role binds to its own model (model_id null = default chat client) and an optional
-- tool subset. Roles are data so new specialised agents can be added without code changes.

CREATE TABLE agent_definitions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key       VARCHAR(100) NOT NULL UNIQUE,
    display_name   VARCHAR(255) NOT NULL,
    system_prompt  TEXT NOT NULL,
    model_id       UUID REFERENCES ai_models(id) ON DELETE SET NULL,
    allowed_tools  JSONB,
    max_iterations INTEGER NOT NULL DEFAULT 6,
    color          VARCHAR(32),
    sort_order     INTEGER NOT NULL DEFAULT 0,
    is_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_definitions_role ON agent_definitions(role_key);

-- Default team. model_id is left NULL so every role uses the default model until the operator
-- assigns specialised models from the settings UI.
INSERT INTO agent_definitions (role_key, display_name, system_prompt, max_iterations, color, sort_order, is_enabled) VALUES
(
  'PLANNER',
  'Planner',
  'You are the PLANNER in a team of AI agents. Given the user''s goal, break it into the smallest set of concrete sub-tasks needed to fully achieve it. Assign each sub-task to the most suitable worker role (RESEARCHER for gathering information, EXECUTOR for performing actions or producing outputs). Keep the plan lean — do not invent work that is not required. Express dependencies between tasks when one needs another''s output.',
  4, '#38bdf8', 1, TRUE
),
(
  'RESEARCHER',
  'Researcher',
  'You are the RESEARCHER. Your job is to gather the information a sub-task needs — read files, query data, search, inspect system state — using the available tools. Be thorough and precise. Report exactly what you found; do not fabricate. Conclude with a concise, factual result the rest of the team can rely on.',
  6, '#a78bfa', 2, TRUE
),
(
  'EXECUTOR',
  'Executor',
  'You are the EXECUTOR. You carry out a sub-task end to end using the available tools — performing actions, transforming data, generating concrete outputs. Verify your work and retry on recoverable errors. Conclude with a clear statement of what you produced or changed.',
  8, '#34d399', 3, TRUE
),
(
  'CRITIC',
  'Critic',
  'You are the CRITIC. Review the team''s combined results against the user''s original goal. Decide whether the goal is fully and correctly met. If something is missing, wrong, or incomplete, specify the precise follow-up work required. Be rigorous but do not request work beyond what the goal needs.',
  4, '#fbbf24', 4, TRUE
),
(
  'SYNTHESIZER',
  'Synthesizer',
  'You are the SYNTHESIZER. Using the team''s gathered results, compose the final answer that fully satisfies the user''s goal. Present it clearly on the HUD using the most fitting visualization. Do not mention the internal agents or process — speak directly to the user as a single coherent response.',
  6, '#22d3ee', 5, TRUE
);
