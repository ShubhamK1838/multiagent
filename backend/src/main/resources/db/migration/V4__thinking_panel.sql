-- Thinking panel: independent toggle for the inline "reasoning trace" section
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret)
VALUES (
           'ui.show_thinking',
           'true',
           'BOOLEAN',
           'UI',
           'Show the AI thinking and reasoning steps before it answers.',
           false
       )
    ON CONFLICT (setting_key) DO NOTHING;

