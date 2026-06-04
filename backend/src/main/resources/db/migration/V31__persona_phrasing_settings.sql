-- Persona personalization + in-character phrasing of proactive remarks.
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('persona.user_name',     '',      'STRING',  'PERSONA', 'The user''s name, used to personalise how JARVIS addresses them (optional)'),
('persona.phrase_alerts', 'false', 'BOOLEAN', 'PERSONA', 'Rephrase proactive alerts in-character via the fast model (fail-soft; adds a short model call per alert)')
ON CONFLICT (setting_key) DO NOTHING;
