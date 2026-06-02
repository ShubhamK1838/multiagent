-- Add AWS Bedrock support to the AI model registry.
-- For BEDROCK provider:
--   aws_region = AWS region (e.g. us-east-1) — required
--   model_id   = Bedrock model identifier (e.g. anthropic.claude-3-5-sonnet-20240620-v1:0)
-- AWS credentials are read from the default SDK chain
-- (env vars, ~/.aws/credentials, IAM role).
ALTER TABLE ai_models
    ADD COLUMN aws_region VARCHAR(50);
