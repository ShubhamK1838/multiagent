-- Additional visualization tools: radial gauges, radar/spider chart,
-- 3D model viewer, timeline, and a structured answer card.

INSERT INTO tool_definitions (id, name, description, parameters_schema, tool_type, handler_config, is_enabled, requires_confirmation, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  'render_gauge',
  'Render radial gauge dials. Use for KPIs, percentages, levels, scores, or any single-number metric with a min/max range.',
  '{"type":"object","properties":{"title":{"type":"string"},"gauges":{"type":"array","items":{"type":"object","properties":{"label":{"type":"string"},"value":{"type":"number"},"min":{"type":"number"},"max":{"type":"number"},"unit":{"type":"string"},"color":{"type":"string"}},"required":["label","value"]}}},"required":["title","gauges"]}',
  'CUSTOM',
  '{"frontend_event":"render_gauge"}',
  true,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'render_radar',
  'Render a radar/spider chart comparing multiple series across shared axes. Use for multi-attribute comparisons, skill profiles, feature matrices.',
  '{"type":"object","properties":{"title":{"type":"string"},"axes":{"type":"array","items":{"type":"string"}},"max":{"type":"number"},"series":{"type":"array","items":{"type":"object","properties":{"label":{"type":"string"},"values":{"type":"array","items":{"type":"number"}},"color":{"type":"string"}},"required":["label","values"]}}},"required":["title","axes","series"]}',
  'CUSTOM',
  '{"frontend_event":"render_radar"}',
  true,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'render_model3d',
  'Render a rotating 3D primitive model. Use to illustrate shapes, objects, or give a tactile 3D focal point for an answer.',
  '{"type":"object","properties":{"title":{"type":"string"},"shape":{"type":"string","enum":["cube","sphere","torus","cone","cylinder","dodecahedron","icosahedron","torusknot"]},"label":{"type":"string"},"color":{"type":"string"},"wireframe":{"type":"boolean"},"spin":{"type":"number"}},"required":["title","shape"]}',
  'CUSTOM',
  '{"frontend_event":"render_model3d"}',
  true,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'render_timeline',
  'Render a vertical timeline of events with done/active/pending status. Use for sequences, roadmaps, histories, step-by-step progress.',
  '{"type":"object","properties":{"title":{"type":"string"},"events":{"type":"array","items":{"type":"object","properties":{"time":{"type":"string"},"title":{"type":"string"},"description":{"type":"string"},"status":{"type":"string","enum":["done","active","pending"]}},"required":["time","title"]}}},"required":["title","events"]}',
  'CUSTOM',
  '{"frontend_event":"render_timeline"}',
  true,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'render_answer',
  'Render a structured answer card with a summary, optional sections, stat highlights, and tags. Use as the primary way to present a textual answer visually on the HUD instead of plain chat text.',
  '{"type":"object","properties":{"title":{"type":"string"},"summary":{"type":"string"},"sections":{"type":"array","items":{"type":"object","properties":{"heading":{"type":"string"},"body":{"type":"string"}},"required":["body"]}},"highlights":{"type":"array","items":{"type":"object","properties":{"label":{"type":"string"},"value":{"type":"string"}},"required":["label","value"]}},"tags":{"type":"array","items":{"type":"string"}}},"required":["title","summary"]}',
  'CUSTOM',
  '{"frontend_event":"render_answer"}',
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
