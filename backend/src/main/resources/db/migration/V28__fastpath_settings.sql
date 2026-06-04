-- Fast-path router: light social turns are answered instantly by a fast model with no tools.
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('agent.fastpath.enabled',  'true', 'BOOLEAN', 'AGENT', 'Answer light social turns instantly with a fast, tool-free model'),
('agent.fastpath.model_id', '',     'STRING',  'AGENT', 'Model id for the fast path (blank = default model)')
ON CONFLICT (setting_key) DO NOTHING;
