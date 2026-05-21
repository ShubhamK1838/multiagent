-- AI model registry: multiple chat models, one marked as default
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL,
    model_id VARCHAR(255) NOT NULL,
    base_url VARCHAR(500),
    api_key TEXT,
    temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
    max_tokens INTEGER NOT NULL DEFAULT 4096,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    options JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uniq_ai_models_single_default
    ON ai_models (is_default) WHERE is_default = TRUE;

CREATE INDEX idx_ai_models_provider ON ai_models(provider);
CREATE INDEX idx_ai_models_enabled  ON ai_models(is_enabled);

-- Seed the existing NVIDIA-hosted OpenAI-compatible model as default
INSERT INTO ai_models (name, provider, model_id, base_url, api_key,
                       temperature, max_tokens, is_default, is_enabled, description)
VALUES (
    'NVIDIA Llama 4 Maverick (default)',
    'OPENAI',
    'meta/llama-4-maverick-17b-128e-instruct',
    'https://integrate.api.nvidia.com',
    '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',
    0.70, 4096, TRUE, TRUE,
    'OpenAI-compatible endpoint hosted on NVIDIA NIM. Seeded from application.yml defaults.'
);
