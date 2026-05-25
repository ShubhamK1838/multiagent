INSERT INTO tool_definitions (name, description, parameters_schema, tool_type, handler_config)
VALUES (
    'draw_ui_shape',
    'Draws a simple geometric shape or text annotation directly onto the user''s HUD canvas. Use this when the user asks you to draw architecture, diagrams, or visualize concepts.',
    '{
      "type": "object",
      "properties": {
        "shape": {
          "type": "string",
          "enum": ["circle", "rectangle", "line", "path"],
          "description": "The type of shape to draw."
        },
        "x": {
          "type": "integer",
          "description": "The X coordinate on the screen (0 to 1920). Center is around 960."
        },
        "y": {
          "type": "integer",
          "description": "The Y coordinate on the screen (0 to 1080). Center is around 540."
        },
        "size": {
          "type": "integer",
          "description": "The size or radius of the shape."
        },
        "color": {
          "type": "string",
          "description": "The hex color code for the shape (e.g. ''#00d4ff'' for cyan, ''#ff0000'' for red)."
        }
      },
      "required": ["shape", "x", "y", "size"]
    }',
    'CUSTOM',
    '{"frontend_event":"draw_ui_shape"}'
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    parameters_schema = EXCLUDED.parameters_schema,
    tool_type = EXCLUDED.tool_type,
    handler_config = EXCLUDED.handler_config;

