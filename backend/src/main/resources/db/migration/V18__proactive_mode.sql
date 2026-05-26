INSERT INTO system_settings (id, setting_key, setting_value, setting_type, category, description, is_secret, created_at, updated_at) VALUES
(gen_random_uuid(), 'proactive.enabled',          'false', 'BOOLEAN', 'AGENT', 'Enable proactive AI monitoring',                false, NOW(), NOW()),
(gen_random_uuid(), 'proactive.watch_path',       '',      'STRING',  'AGENT', 'Directory to watch (empty = user home)',        false, NOW(), NOW()),
(gen_random_uuid(), 'proactive.cpu_threshold',    '85',    'INTEGER', 'AGENT', 'CPU % threshold for alert',                    false, NOW(), NOW()),
(gen_random_uuid(), 'proactive.memory_threshold', '85',    'INTEGER', 'AGENT', 'JVM memory % threshold for alert',             false, NOW(), NOW()),
(gen_random_uuid(), 'proactive.cooldown_seconds', '60',    'INTEGER', 'AGENT', 'Minimum seconds between same-type alerts',     false, NOW(), NOW())
ON CONFLICT DO NOTHING;
