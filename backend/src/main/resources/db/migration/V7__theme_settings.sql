-- UI Themes
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret)
VALUES (
    'ui.theme',
    'default',
    'STRING',
    'UI',
    'The active theme name (e.g. default, ocean, dracula).',
    false
) ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret)
VALUES (
    'ui.themes_json',
    '{
  "default": {},
  "ocean": {
    "--gray-950": "#020617",
    "--gray-900": "#0f172a",
    "--gray-800": "#1e293b",
    "--gray-700": "#334155",
    "--gray-400": "#94a3b8",
    "--gray-100": "#f8fafc",
    "--accent-300": "#93c5fd",
    "--accent-400": "#67e8f9",
    "--accent-500": "#06b6d4",
    "--accent-600": "#0891b2",
    "--accent-700": "#0e7490"
  },
  "dracula": {
    "--gray-950": "#282a36",
    "--gray-900": "#44475a",
    "--gray-800": "#6272a4",
    "--gray-700": "#6272a4",
    "--gray-400": "#f8f8f2",
    "--gray-100": "#f8f8f2",
    "--accent-300": "#ff79c6",
    "--accent-400": "#ff79c6",
    "--accent-500": "#bd93f9",
    "--accent-600": "#bd93f9",
    "--accent-700": "#bd93f9"
  }
}',
    'TEXT',
    'UI',
    'JSON object containing dynamic theme CSS variable definitions.',
    false
) ON CONFLICT (setting_key) DO NOTHING;
