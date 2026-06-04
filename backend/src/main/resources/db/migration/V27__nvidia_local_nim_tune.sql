-- The V26 seed used max_tokens=64 to mirror the Postman example. That's far
-- too small once the framework's system prompt + tool descriptions + RAG
-- context are layered in — the local 3B NIM returns 400 because input+output
-- exceeds its context window. Raise to 1024 for normal chat use.
UPDATE ai_models
SET max_tokens = 1024
WHERE name = 'NVIDIA Llama 3.2 3B (local NIM)'
  AND max_tokens = 64;
