-- Update ask_user tool with full schema documentation so the LLM knows all field types
UPDATE tool_definitions SET
  description = 'Request structured input from the user by generating a dynamic form. The form_schema must be a valid JSON Schema object.

SUPPORTED FIELD TYPES:

Text input:
  {"type":"string","title":"Name"}

Textarea (long text):
  {"type":"string","title":"Description","ui:widget":"textarea","maxLength":500}

Number:
  {"type":"number","title":"Budget","minimum":0}

Integer:
  {"type":"integer","title":"Count","minimum":1,"maximum":100}

Slider / Range:
  {"type":"number","title":"Volume","minimum":0,"maximum":100,"ui:widget":"range"}

Email:
  {"type":"string","format":"email","title":"Email Address"}

URL:
  {"type":"string","format":"uri","title":"Website"}

Phone:
  {"type":"string","format":"phone","title":"Phone Number"}

Date:
  {"type":"string","format":"date","title":"Start Date"}

Date and Time:
  {"type":"string","format":"date-time","title":"Meeting Time"}

Time:
  {"type":"string","format":"time","title":"Alarm Time"}

Dropdown (select one from list):
  {"type":"string","title":"Role","enum":["admin","editor","viewer"],"enumNames":["Administrator","Editor","Viewer"]}

Radio buttons (select one, best for 2-4 options):
  {"type":"string","title":"Priority","enum":["low","medium","high"],"ui:widget":"radio"}

Checkboxes (select multiple from list):
  {"type":"array","title":"Skills","items":{"type":"string","enum":["python","java","react","sql"]},"uniqueItems":true}

Toggle (yes/no boolean):
  {"type":"boolean","title":"Enable Notifications"}

File upload:
  {"type":"string","format":"data-url","title":"Upload Resume"}

Password:
  {"type":"string","ui:widget":"password","title":"Secret Key"}

Color picker:
  {"type":"string","format":"color","title":"Brand Color"}

EXAMPLE — multi-field form:
{
  "title": "New Project",
  "description": "Please fill in the project details",
  "type": "object",
  "properties": {
    "name":     {"type":"string","title":"Project Name","minLength":2,"maxLength":80},
    "type":     {"type":"string","title":"Project Type","enum":["web","api","ml","mobile"],"enumNames":["Web App","REST API","ML Model","Mobile App"]},
    "priority": {"type":"string","title":"Priority","enum":["low","medium","high"],"ui:widget":"radio"},
    "deadline": {"type":"string","format":"date","title":"Deadline"},
    "budget":   {"type":"number","title":"Budget (USD)","minimum":0},
    "public":   {"type":"boolean","title":"Public Repository"},
    "tags":     {"type":"array","title":"Tags","items":{"type":"string","enum":["frontend","backend","devops","ml"]},"uniqueItems":true},
    "notes":    {"type":"string","title":"Additional Notes","ui:widget":"textarea","maxLength":1000}
  },
  "required": ["name","type","priority"]
}',
  parameters_schema = '{"type":"object","properties":{"form_schema":{"type":"object","description":"JSON Schema defining the form fields"},"reason":{"type":"string","description":"Why you need this information from the user"}},"required":["form_schema","reason"]}'
WHERE name = 'ask_user';

-- JARVIS personality and boot settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_secret) VALUES
('jarvis.personality', 'You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), a highly sophisticated AI assistant. You are precise, articulate, and occasionally employ dry wit. Address the user as "sir" or "ma''am". You use tools proactively and chain them together to accomplish complex tasks. When you need structured information from the user, use the ask_user tool to generate a dynamic form — always include a variety of appropriate field types. Never break character.', 'TEXT', 'JARVIS', 'JARVIS personality prompt', false),
('jarvis.boot_message', 'Good day. J.A.R.V.I.S. is online. All systems nominal. How may I assist you?', 'TEXT', 'JARVIS', 'Boot greeting shown on startup', false),
('jarvis.workspace.dir', '/tmp/jarvis-workspace', 'STRING', 'JARVIS', 'Working directory for file tools', false),
('voice.tts.voice', 'onyx', 'STRING', 'VOICE', 'TTS voice: alloy | echo | fable | onyx | nova | shimmer', false),
('voice.autoplay', 'false', 'BOOLEAN', 'VOICE', 'Auto-play voice response', false)
ON CONFLICT (setting_key) DO NOTHING;
