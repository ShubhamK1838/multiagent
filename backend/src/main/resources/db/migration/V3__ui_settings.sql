-- UI-related system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret)
VALUES (
    'ui.debug_panel',
    'true',
    'BOOLEAN',
    'UI',
    'Show the collapsible Debug section under each chat conversation. ' ||
    'When enabled, raw tool calls, reasoning and results are visible for inspection.',
    false
)
ON CONFLICT (setting_key) DO NOTHING;
