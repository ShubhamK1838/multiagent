INSERT INTO tool_definitions (name, description, parameters_schema, tool_type, handler_config) VALUES

(
  'render_table',
  'Renders tabular data as an interactive table panel on the HUD. Use for: database query results, file listings, process lists, comparison data, or any rows-and-columns data. NEVER return tabular data as plain text in FINAL_ANSWER.',
  '{
    "type": "object",
    "properties": {
      "title": { "type": "string", "description": "Panel header title." },
      "columns": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Column header labels."
      },
      "rows": {
        "type": "array",
        "items": {
          "type": "array",
          "items": {}
        },
        "description": "Table rows. Each row is an array of values matching the columns array in length."
      }
    },
    "required": ["title", "columns", "rows"]
  }',
  'CUSTOM', '{"frontend_event":"render_table"}'
),

(
  'render_chart',
  'Renders a bar, line, pie, or area chart panel on the HUD. Use for: metrics over time, usage statistics, numeric comparisons, distributions, or any dataset where a chart conveys the data better than a table.',
  '{
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": ["bar", "line", "pie", "area"],
        "description": "Chart type: bar for comparisons, line/area for trends over time, pie for proportions."
      },
      "title": { "type": "string" },
      "labels": {
        "type": "array",
        "items": { "type": "string" },
        "description": "X-axis labels (or slice names for pie)."
      },
      "datasets": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "label": { "type": "string" },
            "data": { "type": "array", "items": { "type": "number" } },
            "color": { "type": "string", "description": "Optional hex color e.g. #00d4ff" }
          },
          "required": ["label", "data"]
        }
      }
    },
    "required": ["type", "title", "labels", "datasets"]
  }',
  'CUSTOM', '{"frontend_event":"render_chart"}'
),

(
  'render_code',
  'Renders a syntax-highlighted code panel on the HUD. Use for: file contents, generated code snippets, command output, configuration files, or any multi-line text that benefits from syntax highlighting. NEVER dump code as plain text in FINAL_ANSWER.',
  '{
    "type": "object",
    "properties": {
      "title": { "type": "string", "description": "Panel header, e.g. filename or description." },
      "language": {
        "type": "string",
        "description": "Language for syntax highlighting: java, python, typescript, sql, json, bash, yaml, xml, plaintext, etc."
      },
      "code": { "type": "string", "description": "The full code or text content to display." }
    },
    "required": ["title", "language", "code"]
  }',
  'CUSTOM', '{"frontend_event":"render_code"}'
),

(
  'render_json',
  'Renders an interactive collapsible JSON tree panel on the HUD. Use for: API responses, configuration objects, tool results with nested structure, or any JSON value the user wants to explore. NEVER dump raw JSON in FINAL_ANSWER.',
  '{
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "data": {
        "description": "Any JSON-serializable value (object, array, primitive) to display as an interactive tree."
      }
    },
    "required": ["title", "data"]
  }',
  'CUSTOM', '{"frontend_event":"render_json"}'
),

(
  'render_diff',
  'Renders a side-by-side line diff panel on the HUD. Use for: showing git changes, before/after file edits, comparing two versions of text or code. Additions appear green, removals red.',
  '{
    "type": "object",
    "properties": {
      "title": { "type": "string", "description": "Panel header, e.g. filename or change description." },
      "before": { "type": "string", "description": "Original content (left / removed side)." },
      "after":  { "type": "string", "description": "Modified content (right / added side)." },
      "language": {
        "type": "string",
        "description": "Optional language hint for display, e.g. java, python, sql."
      }
    },
    "required": ["title", "before", "after"]
  }',
  'CUSTOM', '{"frontend_event":"render_diff"}'
),

(
  'render_metrics',
  'Renders a KPI / metrics card panel on the HUD. Use for: system stats, performance numbers, counts, percentages, or any set of key-value numeric data where visual emphasis matters.',
  '{
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "metrics": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "label": { "type": "string",  "description": "Metric name." },
            "value": { "description": "Numeric or string value." },
            "unit":  { "type": "string",  "description": "Optional unit suffix, e.g. %, ms, MB." },
            "trend": {
              "type": "string",
              "enum": ["up", "down", "flat"],
              "description": "Optional trend direction indicator."
            }
          },
          "required": ["label", "value"]
        }
      }
    },
    "required": ["title", "metrics"]
  }',
  'CUSTOM', '{"frontend_event":"render_metrics"}'
)

ON CONFLICT (name) DO UPDATE SET
  description       = EXCLUDED.description,
  parameters_schema = EXCLUDED.parameters_schema,
  tool_type         = EXCLUDED.tool_type,
  handler_config    = EXCLUDED.handler_config;
