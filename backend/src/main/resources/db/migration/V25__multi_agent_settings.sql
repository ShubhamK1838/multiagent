-- Multi-agent orchestration settings. Disabled by default so the single-agent path stays the
-- default behaviour; the operator turns the swarm on from the HUD.
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('agent.multi.enabled',     'false',               'BOOLEAN', 'AGENT', 'Route turns through the multi-agent team instead of a single agent'),
('agent.multi.strategy',    'orchestrator_worker', 'STRING',  'AGENT', 'Coordination strategy bean name'),
('agent.multi.max_agents',  '5',                   'INTEGER', 'AGENT', 'Maximum number of agents that may participate in a turn'),
('agent.multi.max_rounds',  '3',                   'INTEGER', 'AGENT', 'Maximum critic review rounds before forcing synthesis'),
('agent.multi.max_retries', '2',                   'INTEGER', 'AGENT', 'Per-task retry attempts before escalation')
ON CONFLICT (setting_key) DO NOTHING;
