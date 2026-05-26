INSERT INTO tool_definitions (name, description, parameters_schema, tool_type, handler_config)
VALUES (
    'render_diagram',
    'Renders a visual diagram panel directly on the user''s HUD screen. Use this to display file trees, architecture overviews, or any hierarchical structure visually. After calling list_files to gather data, call this tool to draw the result on screen instead of responding with plain text.',
    '{
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Title shown in the diagram panel header (e.g. ''File Architecture'', ''Project Structure'')."
        },
        "items": {
          "type": "array",
          "description": "Ordered list of tree nodes. Each node has a label, kind, and depth. Root items have depth 0, their children depth 1, and so on. Items must be in pre-order (parent before children).",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string",
                "description": "Display name of the file or directory. Add a trailing slash for directories (e.g. ''src/'')."
              },
              "kind": {
                "type": "string",
                "enum": ["dir", "file"],
                "description": "Whether this node is a directory or a file."
              },
              "depth": {
                "type": "integer",
                "minimum": 0,
                "description": "Nesting depth. 0 = top level, 1 = one level deep, etc."
              }
            },
            "required": ["label", "kind", "depth"]
          }
        }
      },
      "required": ["title", "items"]
    }',
    'CUSTOM',
    '{"frontend_event":"render_diagram"}'
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    parameters_schema = EXCLUDED.parameters_schema,
    tool_type = EXCLUDED.tool_type,
    handler_config = EXCLUDED.handler_config;
