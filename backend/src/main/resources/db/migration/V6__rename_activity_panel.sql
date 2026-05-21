-- Rename the EventPanel toggle to match the UI label ("Activity")
UPDATE system_settings
SET setting_key = 'ui.activity_panel',
    description = 'Show the right-side Activity panel during chats. ' ||
                  'Streams agent events (thinking, tool calls, results) in real time. ' ||
                  'Hide it for a focused, distraction-free chat layout.'
WHERE setting_key = 'ui.event_panel';

-- Insert the row in case V5 never applied (e.g. on a fresh DB)
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret)
VALUES (
    'ui.activity_panel',
    'true',
    'BOOLEAN',
    'UI',
    'Show the right-side Activity panel during chats. ' ||
    'Streams agent events (thinking, tool calls, results) in real time. ' ||
    'Hide it for a focused, distraction-free chat layout.',
    false
)
ON CONFLICT (setting_key) DO NOTHING;
