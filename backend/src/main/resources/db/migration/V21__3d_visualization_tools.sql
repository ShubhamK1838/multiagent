-- 3D visualization tools: network graph, globe, scatter plot

INSERT INTO tool_definitions (id, name, description, parameters_schema, tool_type, handler_config, is_enabled, requires_confirmation, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  'render_network',
  'Render a 3D force-directed network/graph. Use for relationships, dependencies, connections, flow diagrams.',
  '{"type":"object","properties":{"title":{"type":"string"},"nodes":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"label":{"type":"string"},"color":{"type":"string"}},"required":["id","label"]}},"edges":{"type":"array","items":{"type":"object","properties":{"source":{"type":"string"},"target":{"type":"string"},"color":{"type":"string"}},"required":["source","target"]}}},"required":["title","nodes","edges"]}',
  'CUSTOM',
  '{"frontend_event":"render_network"}',
  true,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'render_globe',
  'Render a rotating 3D globe with data points. Use for geographic data, world maps, location-based information.',
  '{"type":"object","properties":{"title":{"type":"string"},"points":{"type":"array","items":{"type":"object","properties":{"lat":{"type":"number"},"lon":{"type":"number"},"label":{"type":"string"},"value":{"type":"number"}},"required":["lat","lon","label"]}}},"required":["title","points"]}',
  'CUSTOM',
  '{"frontend_event":"render_globe"}',
  true,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'render_scatter3d',
  'Render an interactive 3D scatter plot. Use for multi-dimensional data, clustering, correlations across 3 axes.',
  '{"type":"object","properties":{"title":{"type":"string"},"xLabel":{"type":"string"},"yLabel":{"type":"string"},"zLabel":{"type":"string"},"points":{"type":"array","items":{"type":"object","properties":{"x":{"type":"number"},"y":{"type":"number"},"z":{"type":"number"},"label":{"type":"string"},"series":{"type":"string"}},"required":["x","y","z"]}}},"required":["title","xLabel","yLabel","zLabel","points"]}',
  'CUSTOM',
  '{"frontend_event":"render_scatter3d"}',
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (name) DO UPDATE SET
  description    = EXCLUDED.description,
  parameters_schema = EXCLUDED.parameters_schema,
  handler_config = EXCLUDED.handler_config,
  updated_at     = NOW();
