-- HUD: server log panel visibility setting
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret)
VALUES (
    'hud.server_logs_visible',
    'true',
    'BOOLEAN',
    'UI',
    'Show the real-time server log panel inside the Core Diagnostics HUD widget. ' ||
    'When enabled, tool calls, agent events and system logs stream live inside the HUD. ' ||
    'Disable to keep the diagnostics panel compact.',
    false
)
ON CONFLICT (setting_key) DO NOTHING;
