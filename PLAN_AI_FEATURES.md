# AI Features Implementation Plan

> Features: Session Memory · Proactive Mode · Saved Workflows  
> Current Flyway version: V16  
> Stack: Spring Boot 3.2.5 · PostgreSQL · React + TypeScript · Zustand · SSE

---

## Codebase Conventions to Follow

| Concern | Convention |
|---|---|
| Flyway migrations | Sequential naming `V17__`, `V18__`, `V19__`; plain SQL; `ON CONFLICT DO UPDATE` for tool inserts |
| JPA entities | Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor`; `@JdbcTypeCode(SqlTypes.JSON)` for JSONB; `@PrePersist` for `id` + `createdAt` |
| Tool handlers | Implement `ToolHandler`, `@Component`, register by `handlerName()`; no manual wiring needed |
| Custom/frontend tools | `tool_type = 'CUSTOM'`, `handler_config = '{"frontend_event":"<name>"}'`, handled by `CustomToolStrategy` |
| SSE events | Extend `EventType` enum, call `eventBus.publish(AgentEvent.of(...))` |
| Settings | Insert via Flyway; read with `settingsService.getBoolean/getInt/get` |
| Frontend API | All backend calls in `src/services/api.ts` as named groups |
| Frontend state | Single Zustand store in `chatStore.ts`; add slices, never create separate stores |

---

---

# Feature 1 — Session Memory

**Goal:** Auto-summarize each conversation when it ends, persist the summary, and inject the last N summaries into every new conversation's system prompt so the AI remembers paths, tasks, and preferences across sessions.

---

## 1.1 DB Schema — `V17__session_memory.sql`

```sql
CREATE TABLE conversation_summaries (
    id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID      NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    summary         TEXT      NOT NULL,
    key_paths       TEXT[],
    key_facts       JSONB     NOT NULL DEFAULT '{}',
    model_used      VARCHAR(100),
    token_count     INTEGER,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (conversation_id)
);

CREATE INDEX idx_conv_summaries_time ON conversation_summaries(created_at DESC);

INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('memory.enabled',               'true', 'BOOLEAN', 'AGENT', 'Inject past session summaries into system prompt'),
('memory.max_summaries',         '5',    'INTEGER', 'AGENT', 'Number of past summaries to inject'),
('memory.min_messages',          '4',    'INTEGER', 'AGENT', 'Minimum conversation messages before summarising'),
('memory.summary_prompt',
 'Summarise this conversation in 3-5 sentences. Extract: (1) file paths the user worked with, (2) tasks completed, (3) any stated preferences. Respond ONLY as JSON: {"summary":"...","key_paths":["..."],"key_facts":{}}',
 'TEXT', 'AGENT', 'Prompt sent to LLM to generate a memory summary');
```

---

## 1.2 New Backend Files

| File | Package | Responsibility |
|---|---|---|
| `ConversationSummary.java` | `domain.entity` | JPA entity for `conversation_summaries` |
| `ConversationSummaryRepository.java` | `domain.repository` | `findTop5ByOrderByCreatedAtDesc()`, `findByConversationId()` |
| `SessionMemoryService.java` | `service.memory` | `summarizeAndSave(UUID)`, `buildMemoryBlock()` |
| `MemoryController.java` | `api` | REST CRUD at `/api/v1/memory/summaries` |

### `SessionMemoryService` key methods

```
summarizeAndSave(UUID conversationId)
  - Skip if message count < memory.min_messages setting
  - Load messages via ConversationService
  - Call LLMService.chat() with memory.summary_prompt
  - Parse JSON response (fallback: save raw string on parse failure)
  - Upsert ConversationSummary (ON CONFLICT conversation_id → update)
  - Log via LogStreamService

buildMemoryBlock() → String
  - Return "" if memory.enabled = false or no summaries exist
  - Query top N summaries
  - Format as markdown block injected into system prompt
```

---

## 1.3 Existing Backend Files to Modify

| File | Change |
|---|---|
| `AgentOrchestrator.java` | Inject `SessionMemoryService`; call `summarizeAndSave()` async after AGENT_END on normal completion only (not cancellation/exhaustion) |
| `SystemPromptBuilder.java` | Add `String memoryBlock` param to `build()`; add `appendMemoryBlock()` between base prompt and RAG context |
| `LLMService.java` | Pass `memoryBlock` through to `SystemPromptBuilder.build()` |
| `AgentMessageBuilder.java` | Inject `SessionMemoryService`; call `buildMemoryBlock()` and forward to `LLMService` |

---

## 1.4 New Frontend Files

| File | Responsibility |
|---|---|
| `src/components/memory/MemoryPanel.tsx` | Lists past summaries fetched from API; shows date, truncated summary, key-paths tags; "Wipe Memory" button with confirm |

---

## 1.5 Existing Frontend Files to Modify

| File | Change |
|---|---|
| `src/types/index.ts` | Add `ConversationSummary` interface |
| `src/services/api.ts` | Add `memoryApi` group (`listSummaries`, `getSummary`, `clearAll`) |
| `src/App.tsx` | Add Memory tab/route rendering `MemoryPanel` |

---

## 1.6 API Endpoints

| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/memory/summaries` | `ConversationSummary[]` |
| GET | `/api/v1/memory/summaries/{conversationId}` | `ConversationSummary` |
| DELETE | `/api/v1/memory/summaries` | `{"deleted": N}` |

---

## 1.7 Implementation Order

1. Apply `V17__session_memory.sql`
2. Create entity + repository; confirm JPA compiles
3. Create `SessionMemoryService` with stub `summarizeAndSave` (log only); wire into `AgentOrchestrator`; boot and confirm no circular deps
4. Implement full `summarizeAndSave` with LLM call + JSON parse + upsert
5. Implement `buildMemoryBlock()`
6. Modify `SystemPromptBuilder` → `LLMService` → `AgentMessageBuilder` signature chain
7. Create `MemoryController`
8. Add type + API to frontend; create `MemoryPanel`; wire into `App.tsx`
9. **E2E test:** run a conversation → complete it → check DB for summary row → start new conversation → confirm memory block appears in system prompt (visible in LogStream panel)

---

## 1.8 Risks & Decisions

| Risk / Decision | Notes |
|---|---|
| Summarization adds API quota after every conversation | Gate on `memory.min_messages`; only summarize on normal completion |
| LLM may return invalid JSON | Wrap Jackson parse in try/catch; save raw string as summary with empty keyPaths/keyFacts |
| Memory injection position | Inject between base prompt and RAG context — before tool list, so LLM has context before seeing available tools |
| One summary per conversation | `UNIQUE(conversation_id)` + upsert; if conversation is reopened later, summary is updated |

---

---

# Feature 2 — Proactive Mode

**Goal:** Backend monitors file-system changes (Java `WatchService`) and system metrics. When something noteworthy happens, the AI pushes a toast notification into the active conversation's HUD without any user prompt. Toggle on/off from the HUD control bar.

---

## 2.1 DB Schema — `V18__proactive_mode.sql`

```sql
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('proactive.enabled',          'false', 'BOOLEAN', 'AGENT', 'Enable proactive AI monitoring'),
('proactive.watch_path',       '',      'STRING',  'AGENT', 'Directory to watch (empty = user home)'),
('proactive.cpu_threshold',    '85',    'INTEGER', 'AGENT', 'CPU % threshold for alert'),
('proactive.memory_threshold', '85',    'INTEGER', 'AGENT', 'JVM memory % threshold for alert'),
('proactive.cooldown_seconds', '60',    'INTEGER', 'AGENT', 'Minimum seconds between same-type alerts');
```

No new tables — alerts are ephemeral SSE events, intentionally not persisted.

---

## 2.2 New Backend Files

| File | Package | Responsibility |
|---|---|---|
| `ActiveConversationTracker.java` | `service.proactive` | Holds `volatile String activeConversationId`; set by `ChatController` on each incoming message |
| `ProactiveAlertPublisher.java` | `service.proactive` | Cooldown-aware publisher; checks `proactive.enabled`; calls `eventBus.publish(PROACTIVE_ALERT, ...)` |
| `FileWatchMonitor.java` | `service.proactive` | Daemon thread using `java.nio.file.WatchService`; watches configured path; calls `ProactiveAlertPublisher` on file create/modify |
| `SystemMetricsMonitor.java` | `service.proactive` | `@Scheduled` poller; checks JVM memory + OS load average; calls publisher on threshold breach |
| `ProactiveModeController.java` | `api` | REST at `/api/v1/proactive`; get status, toggle, set watch path |

### `FileWatchMonitor` critical notes
- Runs as daemon thread started in `@PostConstruct`
- Call `key.reset()` after every `key.pollEvents()` or the watcher stops firing
- `@PreDestroy` sets `isRunning = false` and calls `watchService.close()`
- Default watch depth: **single level only** (not recursive) to avoid Windows event storms
- Re-reads `proactive.watch_path` setting each time the watcher restarts

---

## 2.3 Existing Backend Files to Modify

| File | Change |
|---|---|
| `EventType.java` | Add `PROACTIVE_ALERT` enum value |
| `EventBus.java` (interface + impl) | Add `publishProactiveAlert(String conversationId, String message)` |
| `ChatController.java` | Inject `ActiveConversationTracker`; call `setActive(conversationId)` on each incoming message |

---

## 2.4 New Frontend Files

| File | Responsibility |
|---|---|
| `src/components/hud/ProactiveAlertToast.tsx` | Floating toast stack (top-left, amber accent); auto-dismisses in 8s with countdown border; stacks up to 3; close button |

---

## 2.5 Existing Frontend Files to Modify

| File | Change |
|---|---|
| `src/types/index.ts` | Add `'PROACTIVE_ALERT'` to `EventType` union |
| `src/hooks/useSSE.ts` | Add `'PROACTIVE_ALERT'` to `eventTypes`; add case calling `store.addProactiveAlert(event.content)` |
| `src/store/chatStore.ts` | Add `proactiveAlerts: string[]` slice; `addProactiveAlert()` (cap at 3); `dismissProactiveAlert(index)` |
| `src/components/hud/HudControlBar.tsx` | Add `proactiveEnabled: boolean` + `onToggleProactive` prop; render amber pulsing toggle button |
| `src/components/layout/JarvisHUDView.tsx` | Render `<ProactiveAlertToast>`; wire proactive toggle to `proactiveModeApi.toggle()` |
| `src/services/api.ts` | Add `proactiveModeApi` group (`getStatus`, `toggle`, `setWatchPath`) |

---

## 2.6 API Endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/proactive/status` | — | `{"enabled": bool, "watchPath": string}` |
| POST | `/api/v1/proactive/toggle` | — | `{"enabled": bool}` |
| PUT | `/api/v1/proactive/watch-path` | `{"path": "..."}` | `{"watchPath": "..."}` |

---

## 2.7 Implementation Order

1. Apply `V18__proactive_mode.sql`
2. Add `PROACTIVE_ALERT` to `EventType`; add `publishProactiveAlert` to `EventBus`
3. Create `ActiveConversationTracker`; inject into `ChatController.sendMessage`
4. Create `ProactiveAlertPublisher` (no monitors yet); manually call it in a test endpoint to verify the SSE event arrives in the HUD
5. Create `SystemMetricsMonitor`; verify metric alerts appear in logs with `proactive.enabled=true`
6. Create `FileWatchMonitor` with daemon thread; verify file-create event fires
7. Create `ProactiveModeController`
8. Add `PROACTIVE_ALERT` to frontend types; add store slice; add SSE case
9. Create `ProactiveAlertToast.tsx`; wire into `JarvisHUDView`
10. Add toggle to `HudControlBar`
11. **E2E test:** enable proactive mode → create a file in watched path → confirm amber toast appears in HUD

---

## 2.8 Risks & Decisions

| Risk / Decision | Notes |
|---|---|
| Windows `WatchService` event storms in home dir | Watch single level only by default; let user set a specific project path |
| `ActiveConversationTracker` is a global singleton | Last-written conversation ID wins across tabs; acceptable for single-user personal tool; document in code |
| Alerts are NOT persisted | Intentional — they must not appear in conversation history or be picked up by memory summarizer |
| CPU on JVM vs OS | `ManagementFactory.getOperatingSystemMXBean().getSystemLoadAverage()` returns `-1` on Windows; fall back to JVM memory-only monitoring on Windows, skip CPU alert |

---

---

# Feature 3 — Saved Workflows

**Goal:** Record a named sequence of tool calls and replay it as a single command. The AI can save workflows via `save_workflow` tool. The user can replay them from the HUD panel or by asking the AI to `run_workflow`.

---

## 3.1 DB Schema — `V19__saved_workflows.sql`

```sql
CREATE TABLE workflows (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    run_count   INTEGER      NOT NULL DEFAULT 0,
    last_run_at TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_steps (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID    NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order  INTEGER NOT NULL,
    tool_name   VARCHAR(255) NOT NULL,
    tool_args   JSONB        NOT NULL DEFAULT '{}',
    UNIQUE (workflow_id, step_order)
);

CREATE INDEX idx_workflow_steps_wf ON workflow_steps(workflow_id);

INSERT INTO tool_definitions (name, description, parameters_schema, tool_type, handler_config) VALUES
(
  'save_workflow',
  'Save a sequence of tool calls as a named replayable workflow. Call this after completing a multi-step task to record it for future use.',
  '{"type":"object","properties":{"name":{"type":"string"},"description":{"type":"string"},"steps":{"type":"array","items":{"type":"object","properties":{"tool_name":{"type":"string"},"tool_args":{"type":"object"}},"required":["tool_name","tool_args"]}}},"required":["name","steps"]}',
  'BUILTIN', '{"handler":"save_workflow"}'
),
(
  'run_workflow',
  'Replay a saved workflow by name, executing each step in sequence.',
  '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}',
  'BUILTIN', '{"handler":"run_workflow"}'
),
(
  'list_workflows',
  'List all saved workflows with names, descriptions, and step counts.',
  '{"type":"object","properties":{}}',
  'BUILTIN', '{"handler":"list_workflows"}'
)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  parameters_schema = EXCLUDED.parameters_schema;
```

---

## 3.2 New Backend Files

| File | Package | Responsibility |
|---|---|---|
| `Workflow.java` | `domain.entity` | JPA entity; `@PreUpdate` sets `updatedAt` |
| `WorkflowStep.java` | `domain.entity` | JPA entity; `toolArgs` as JSONB |
| `WorkflowRepository.java` | `domain.repository` | `findByName()`, `findAllByOrderByNameAsc()` |
| `WorkflowStepRepository.java` | `domain.repository` | `findByWorkflowIdOrderByStepOrderAsc()`, `deleteByWorkflowId()` |
| `WorkflowService.java` | `service.workflow` | `saveWorkflow()`, `runWorkflow()`, `listWorkflows()`, `deleteWorkflow()` |
| `SaveWorkflowHandler.java` | `core.tool.handlers` | Implements `ToolHandler`; `handlerName() = "save_workflow"` |
| `RunWorkflowHandler.java` | `core.tool.handlers` | Implements `ToolHandler`; `handlerName() = "run_workflow"` |
| `ListWorkflowsHandler.java` | `core.tool.handlers` | Implements `ToolHandler`; `handlerName() = "list_workflows"` |
| `WorkflowController.java` | `api` | REST CRUD + run endpoint at `/api/v1/workflows` |

### `WorkflowService.runWorkflow` design
```
runWorkflow(String name, String conversationId)
  - Find workflow by name (throw if not found)
  - Load steps ordered by step_order
  - For each step: toolDispatcher.dispatch(toolRegistry.findByName(step.toolName), step.toolArgs, conversationId)
  - Collect results
  - Increment runCount, set lastRunAt
  - Return combined result string
```

### Circular dependency resolution
`RunWorkflowHandler → WorkflowService → ToolDispatcher → ToolHandlerRegistry → RunWorkflowHandler`

**Fix:** Use `@Lazy` on the `WorkflowService` injection inside `RunWorkflowHandler`:
```java
public RunWorkflowHandler(@Lazy WorkflowService workflowService) { ... }
```
Add a comment explaining why `@Lazy` is required.

---

## 3.3 Existing Backend Files to Modify

None required beyond the SQL migration and new files above.

---

## 3.4 New Frontend Files

| File | Responsibility |
|---|---|
| `src/components/hud/WorkflowPanel.tsx` | Draggable HUD panel; lists workflows with name, description, run count, last-run time; RUN + DELETE buttons per row |
| `src/components/hud/WorkflowRecordModal.tsx` | Modal to name + describe a new workflow; "Ask AI to record" button sends a message to the conversation instructing the AI to call `save_workflow` |
| `src/hooks/useWorkflows.ts` | Fetches workflow list; exposes `runWorkflow(name)`, `deleteWorkflow(name)`, `refresh()` |

---

## 3.5 Existing Frontend Files to Modify

| File | Change |
|---|---|
| `src/types/index.ts` | Add `Workflow`, `WorkflowStep`, `WorkflowWithSteps`, `WorkflowCreateRequest` interfaces |
| `src/services/api.ts` | Add `workflowApi` group (`list`, `get`, `create`, `delete`, `run`) |
| `src/components/layout/ArcReactorMenu.tsx` | Add `workflows` menu item (emerald accent, `▷` icon) |
| `src/hooks/useHudLayout.ts` | Add `workflows` to `DEFAULT_LAYOUT` panels (default visible: false) |
| `src/components/layout/JarvisHUDView.tsx` | Render `<WorkflowPanel>` inside `AnimatePresence` when `panels.workflows?.visible` |

---

## 3.6 API Endpoints

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/v1/workflows` | — | `WorkflowWithSteps[]` |
| GET | `/api/v1/workflows/{name}` | — | `WorkflowWithSteps` |
| POST | `/api/v1/workflows` | `{name, description, steps[]}` | `Workflow` |
| DELETE | `/api/v1/workflows/{name}` | — | `{"deleted": name}` |
| POST | `/api/v1/workflows/{name}/run` | `{"conversationId": "..."}` | `{"result": "..."}` |

---

## 3.7 Implementation Order

1. Apply `V19__saved_workflows.sql`; confirm tables + 3 tool rows exist
2. Create entities + repositories; confirm JPA compiles
3. Create `WorkflowService` with `saveWorkflow`, `listWorkflows`, `deleteWorkflow`; stub `runWorkflow`
4. Create `SaveWorkflowHandler`, `ListWorkflowsHandler`, `RunWorkflowHandler` (stub); confirm all appear in `ToolHandlerRegistry` log at startup
5. Test via AI: "Save a workflow called test-list that lists my home directory" → confirm DB row
6. Test via AI: "List my workflows" → confirm response
7. Implement full `WorkflowService.runWorkflow` with `@Lazy` fix; test via AI: "Run the test-list workflow"
8. Create `WorkflowController`
9. Add types + `workflowApi` to frontend
10. Create `useWorkflows`, `WorkflowPanel`, `WorkflowRecordModal`
11. Update `ArcReactorMenu`, `useHudLayout`, `JarvisHUDView`
12. **E2E test:** from HUD panel, click RUN on a workflow → confirm result appears in conversation feed

---

## 3.8 Risks & Decisions

| Risk / Decision | Notes |
|---|---|
| Circular bean dependency | Use `@Lazy` on `WorkflowService` in `RunWorkflowHandler`; comment why |
| Workflow steps store hardcoded paths | Intentional — workflows are exact-replay, not parameterised. Future v2 can add `{{variable}}` substitution |
| Replay blocks HTTP thread | For the REST `/run` endpoint, this is a known limitation. For AI-triggered replay via `run_workflow` tool, it runs inside the async `AgentOrchestrator` thread — no issue there |
| Workflow name as primary identifier | `UNIQUE(name)` + upsert on `save_workflow`; saving the same name twice updates the workflow |

---

---

# Cross-Cutting Notes

## Flyway Sequence
V17 → V18 → V19. Must be applied in order. Cannot be rolled back independently if implemented on the same branch.

## Thread Pool
`AgentOrchestrator` is already `@Async`. The summarization call and `FileWatchMonitor` daemon thread are independent. If Spring Boot's default `SimpleAsyncTaskExecutor` becomes a bottleneck, configure a bounded `ThreadPoolTaskExecutor` in `AiConfiguration.java`.

## Settings Category
All new settings use category `'AGENT'`. They automatically appear in the existing AGENT settings tab — no frontend settings UI changes needed.

## New Tab Order (App.tsx)
Suggested order: Chat · HUD · Models · Tools · Memory · Settings · RAG

---

## Critical Files Reference

| File | Role |
|---|---|
| `backend/.../AgentOrchestrator.java` | Main agent loop — entry point for memory summarization trigger |
| `backend/.../AgentMessageBuilder.java` | Builds LLM message list — entry point for memory injection |
| `backend/.../SystemPromptBuilder.java` | System prompt — add `appendMemoryBlock()` here |
| `backend/.../EventType.java` | Add `PROACTIVE_ALERT` here |
| `backend/.../EventBus.java` | Add `publishProactiveAlert()` here |
| `backend/.../ChatController.java` | Add `ActiveConversationTracker.setActive()` call here |
| `frontend/src/store/chatStore.ts` | Add `proactiveAlerts` slice here |
| `frontend/src/hooks/useSSE.ts` | Add `PROACTIVE_ALERT` case here |
| `frontend/src/components/layout/JarvisHUDView.tsx` | Wire all new HUD panels here |
| `frontend/src/services/api.ts` | Add `memoryApi`, `proactiveModeApi`, `workflowApi` here |
