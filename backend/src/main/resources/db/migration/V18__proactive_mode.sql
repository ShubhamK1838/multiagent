INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('proactive.enabled',          'false', 'BOOLEAN', 'AGENT', 'Enable proactive AI monitoring'),
('proactive.watch_path',       '',      'STRING',  'AGENT', 'Directory to watch (empty = user home)'),
('proactive.cpu_threshold',    '85',    'INTEGER', 'AGENT', 'CPU % threshold for alert'),
('proactive.memory_threshold', '85',    'INTEGER', 'AGENT', 'JVM memory % threshold for alert'),
('proactive.cooldown_seconds', '60',    'INTEGER', 'AGENT', 'Minimum seconds between same-type alerts')
ON CONFLICT (setting_key) DO NOTHING;
