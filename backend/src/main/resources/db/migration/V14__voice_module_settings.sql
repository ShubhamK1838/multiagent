-- Voice module settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret)
VALUES
    ('voice.enabled', 'true', 'BOOLEAN', 'VOICE', 'Enable/disable JARVIS voice module', false),
    ('voice.tts.url', 'http://localhost:5000', 'STRING', 'VOICE', 'Piper TTS server URL', false),
    ('voice.tts.speed', '1.0', 'STRING', 'VOICE', 'TTS playback speed (0.5-2.0)', false),
    ('voice.wakeword.enabled', 'true', 'BOOLEAN', 'VOICE', 'Enable wake word detection', false),
    ('voice.wakeword.word', 'jarvis', 'STRING', 'VOICE', 'Wake word to activate voice', false),
    ('voice.effects.enabled', 'true', 'BOOLEAN', 'VOICE', 'Enable JARVIS audio effects', false),
    ('voice.volume', '0.8', 'STRING', 'VOICE', 'Master voice volume (0-1)', false)
ON CONFLICT (setting_key) DO NOTHING;
