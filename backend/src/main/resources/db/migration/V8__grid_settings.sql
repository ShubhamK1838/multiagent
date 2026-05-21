-- Grid UI Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret)
VALUES (
    'ui.grid_line_width',
    '0.2',
    'DECIMAL',
    'UI',
    'The thickness of the background grid lines and traveling beams (0.1 to 2.0 recommended).',
    false
) ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret)
VALUES (
    'ui.grid_opacity',
    '0.015',
    'DECIMAL',
    'UI',
    'The base opacity of the static grid lines (0.005 to 0.05 recommended).',
    false
) ON CONFLICT (setting_key) DO NOTHING;
