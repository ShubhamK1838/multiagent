-- Register a locally-hosted NVIDIA NIM (OpenAI-compatible) chat model.
-- Endpoint: POST http://localhost:8000/v1/chat/completions
-- Model:    meta/llama-3.2-3b-instruct
-- The NIM exposes the standard OpenAI /v1 schema, so we reuse the OPENAI
-- provider just like the existing cloud NVIDIA seed.
INSERT INTO ai_models (name, provider, model_id, base_url, api_key,
                       temperature, max_tokens, is_default, is_enabled, description)
VALUES (
    'NVIDIA Llama 3.2 3B (local NIM)',
    'OPENAI',
    'meta/llama-3.2-3b-instruct',
    'http://localhost:8000',
    NULL,
    0.70, 64, FALSE, TRUE,
    'Locally-hosted NVIDIA NIM running meta/llama-3.2-3b-instruct on port 8000. OpenAI-compatible /v1/chat/completions schema; no API key required.'
)
ON CONFLICT (name) DO NOTHING;
