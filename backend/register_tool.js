const payload = {
  name: "draw_ui_shape",
  description: "Draws a specific vector shape on the user's HUD at specified coordinates. Use this when the user asks you to draw something on the screen.",
  parametersSchema: {
    type: "object",
    properties: {
      shape: { type: "string", enum: ["circle", "rectangle", "line", "text"] },
      x: { type: "number", description: "X coordinate (pixels)" },
      y: { type: "number", description: "Y coordinate (pixels)" },
      size: { type: "number", description: "Radius or Width (pixels)" },
      color: { type: "string", description: "Hex color e.g. #ff0000 or #00d4ff" },
      text: { type: "string", description: "Text content if shape is text" }
    },
    required: ["shape", "x", "y", "size", "color"]
  },
  toolType: "custom",
  handlerConfig: {
    frontend_event: "draw_ui_shape"
  },
  requiresConfirmation: false,
  enabled: true
};

fetch('http://localhost:8080/api/v1/tools', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
}).then(r => r.json()).then(console.log).catch(console.error);
