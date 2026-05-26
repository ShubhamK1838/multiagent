-- File management tools
INSERT INTO tool_definitions (name, description, parameters_schema, tool_type, handler_config, requires_confirmation) VALUES
(
    'list_files',
    'List files and directories at a given path',
    '{"type":"object","properties":{"path":{"type":"string","description":"Directory path to list. Defaults to user home directory."}}}',
    'BUILTIN',
    '{"handler":"list_files"}',
    FALSE
),
(
    'open_file',
    'Open a file with its default application',
    '{"type":"object","properties":{"path":{"type":"string","description":"Absolute path to the file to open"}},"required":["path"]}',
    'BUILTIN',
    '{"handler":"open_file"}',
    FALSE
),
(
    'delete_file',
    'Delete a file permanently. Refuses directories and protected system paths.',
    '{"type":"object","properties":{"path":{"type":"string","description":"Absolute path to the file to delete"}},"required":["path"]}',
    'BUILTIN',
    '{"handler":"delete_file"}',
    TRUE
),
(
    'search_files',
    'Search for files by name within a directory tree (up to 5 levels deep, max 50 results)',
    '{"type":"object","properties":{"query":{"type":"string","description":"Filename query string (case-insensitive)"},"path":{"type":"string","description":"Base directory to search. Defaults to user home directory."}},"required":["query"]}',
    'BUILTIN',
    '{"handler":"search_files"}',
    FALSE
),
(
    'get_file_metadata',
    'Get detailed metadata for a file or directory: size, timestamps, permissions, extension',
    '{"type":"object","properties":{"path":{"type":"string","description":"Absolute path to the file or directory"}},"required":["path"]}',
    'BUILTIN',
    '{"handler":"get_file_metadata"}',
    FALSE
),

-- System tools
(
    'launch_application',
    'Launch a desktop application by name',
    '{"type":"object","properties":{"app_name":{"type":"string","description":"Name of the application to launch (alphanumeric, spaces, dots and hyphens only)"}},"required":["app_name"]}',
    'BUILTIN',
    '{"handler":"launch_application"}',
    FALSE
),
(
    'execute_command',
    'Execute a whitelisted read-only terminal command and return its output. Allowed: ls, dir, pwd, echo, date, time, whoami, ping, ipconfig, ifconfig, cat, type, grep, find, wc, sort, head, tail, hostname, uname, df, du',
    '{"type":"object","properties":{"cmd":{"type":"string","description":"Command to execute. Must start with an allowed command name."}},"required":["cmd"]}',
    'BUILTIN',
    '{"handler":"execute_command"}',
    TRUE
),
(
    'get_system_info',
    'Get current system information: OS, Java version, username, CPU count, memory usage',
    '{"type":"object","properties":{}}',
    'BUILTIN',
    '{"handler":"get_system_info"}',
    FALSE
);
