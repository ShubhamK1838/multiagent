const payload = {
  toolType: "frontend_event",
  handlerConfig: {
    event_name: "draw_ui_shape"
  }
};

fetch('http://localhost:8080/api/v1/tools/2594e495-0a21-4f75-85fb-10e7de0e59bb', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
}).then(r => r.json()).then(console.log).catch(console.error);
