-- Toggle for the right-side Agent Events / activity panel in chat view
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret)
VALUES (
           'ui.event_panel',
           'true',
           'BOOLEAN',
           'UI',
           'Show the right-side activity panel during chats. Streams agent events ' ||
           '(thinking, tool calls, results) in real time. Hide it for a focused, ' ||
           'distraction-free chat layout.',
           false
       )
    ON CONFLICT (setting_key) DO NOTHING;


-- Add Postgres Query tool
INSERT INTO tool_definitions (name, description, parameters_schema, tool_type, handler_config)
VALUES (
    'postgres_query',
    'Execute a read-only SQL query against the connected PostgreSQL database to retrieve data.',
    '{"type":"object","properties":{"query":{"type":"string","description":"The SQL query to execute."}},"required":["query"]}',
    'BUILTIN',
    '{"handler":"postgres_query"}'
)
ON CONFLICT (name) DO NOTHING;
