-- Sandboxed code execution: run a short Python or Node snippet. Real code execution, so it is
-- gated behind confirmation — the user approves each run.
INSERT INTO tool_definitions (name, description, parameters_schema, tool_type, handler_config, requires_confirmation) VALUES
(
    'run_code',
    'Execute a short Python or Node.js snippet and return its output. Runs in a temporary file with a 15s timeout. Use for quick calculations, data transforms, or generating results programmatically.',
    '{"type":"object","properties":{"language":{"type":"string","enum":["python","node"],"description":"Language to run. Defaults to python."},"code":{"type":"string","description":"The source code to execute."}},"required":["code"]}',
    'BUILTIN',
    '{"handler":"run_code"}',
    TRUE
)
ON CONFLICT (name) DO NOTHING;
