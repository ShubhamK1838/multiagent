# JARVIS — Multi-Agent AI Framework

A self-hostable, JARVIS-style AI assistant platform: a Spring Boot backend that
orchestrates LLM agents, tools, RAG, and multi-agent coordination, paired with a
React HUD frontend with voice, vision, and 3D data-visualization panels.

> **Stack:** Spring Boot 3.2.5 · Java 21 · Spring AI 1.0.0 · PostgreSQL + pgvector ·
> Flyway · React + TypeScript · Vite · Zustand · Server-Sent Events (SSE)

---

## Features

- **Conversational agent loop** — iterative reasoning, tool calling, and streaming
  responses (`core/agent`, `core/ai`).
- **Pluggable tools** — file ops, command/code execution, HTTP, Postgres queries,
  RAG search, workflows, and visualization tools (`core/tool/handlers`).
- **Multi-agent coordination** — orchestrator/worker strategies, task boards, and a
  shared blackboard (`core/agent/multi`).
- **RAG** — document ingestion + pgvector semantic search (`core/rag`).
- **Session memory** — auto-summarizes conversations and injects past context.
- **Proactive mode** — file/system/schedule monitors that surface alerts via SSE.
- **Saved workflows** — persist and re-run multi-step tool sequences.
- **Multiple model providers** — OpenAI, Ollama (local), and AWS Bedrock.
- **Voice & vision** — transcription, speech synthesis (Piper TTS), and image analysis.
- **HUD frontend** — animated panels, agent swarm view, diagnostics, and 3D/chart
  visualizations.

---

## Repository layout

```
.
├── backend/                  # Spring Boot service
│   ├── src/main/java/com/aiframework/
│   │   ├── api/              # REST controllers (+ api/dto)
│   │   ├── config/           # Spring configuration
│   │   ├── core/             # Domain core
│   │   │   ├── agent/        #   agent loop + multi/ (multi-agent)
│   │   │   ├── ai/           #   prompt building, response parsing, streaming
│   │   │   ├── tool/         #   tool registry, dispatch, handlers, strategies
│   │   │   ├── rag/          #   retrieval-augmented generation
│   │   │   └── event/        #   SSE event bus
│   │   ├── domain/           # JPA entities + repositories
│   │   └── service/          # Application services (ai, memory, workflow, …)
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/     # Flyway migrations (V1 … V31)
│   └── scripts/              # Dev helper scripts (tool registration)
├── frontend/                 # React + Vite app
│   └── src/
│       ├── components/       # Feature-foldered UI (chat, hud, tools, diagnostics, …)
│       ├── hooks/            # React hooks (chat, SSE, voice, layout, …)
│       ├── contexts/         # React contexts (theme, gestures, security)
│       ├── services/api.ts   # All backend calls, grouped by domain
│       └── store/chatStore.ts# Single Zustand store
├── docker-compose.yml        # Full stack: postgres + ollama + backend + frontend + piper-tts
└── PLAN_AI_FEATURES.md       # Historical design notes for memory/proactive/workflows
```

---

## Quick start (Docker)

The fastest way to run the whole stack (Postgres + Ollama + backend + frontend +
Piper TTS):

```bash
# Optional: set an OpenAI key (otherwise Ollama is used for local models)
export OPENAI_API_KEY=sk-...

docker compose up --build
```

| Service   | URL                      |
|-----------|--------------------------|
| Frontend  | http://localhost:3000    |
| Backend   | http://localhost:8080    |
| Postgres  | localhost:5432           |
| Ollama    | http://localhost:11434   |
| Piper TTS | http://localhost:5000    |

> The `ollama-init` container pulls the `nomic-embed-text` embedding model on first
> boot. The Ollama service requests an NVIDIA GPU; drop the `deploy.resources` block
> in `docker-compose.yml` to run CPU-only.

---

## Local development

### Backend

Requires **JDK 21** and a running PostgreSQL (with the `pgvector` extension). The
schema is created automatically by Flyway on startup.

```bash
cd backend
mvn spring-boot:run
```

Key environment variables (see `docker-compose.yml` and `application.yml`):

| Variable          | Purpose                                  | Default                                   |
|-------------------|------------------------------------------|-------------------------------------------|
| `DB_URL`          | JDBC URL                                 | `jdbc:postgresql://localhost:5432/aiframework` |
| `DB_USER`/`DB_PASS` | Database credentials                   | `postgres` / `postgres`                   |
| `OPENAI_API_KEY`  | OpenAI key (if using OpenAI models)      | —                                         |
| `OLLAMA_BASE_URL` | Ollama endpoint                          | `http://localhost:11434`                  |
| `EMBEDDING_MODEL` | Embedding model for RAG                  | `nomic-embed-text`                        |

Build / test:

```bash
mvn compile        # compile
mvn test           # run the test suite
mvn package        # build the runnable jar
```

### Frontend

Requires **Node 20+**.

```bash
cd frontend
npm install
npm run dev        # Vite dev server (proxies API calls to the backend)
npm run build      # type-check (tsc) + production build
```

---

## Conventions

These are enforced across the codebase (see `PLAN_AI_FEATURES.md` for the original
write-up):

- **Flyway migrations** — sequential `V<n>__name.sql`, plain SQL; tool inserts use
  `ON CONFLICT DO UPDATE`.
- **JPA entities** — Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor`;
  `@JdbcTypeCode(SqlTypes.JSON)` for JSONB columns.
- **Tool handlers** — implement `ToolHandler`, annotate `@Component`, register via
  `handlerName()` (no manual wiring).
- **SSE events** — extend the `EventType` enum and publish through `eventBus`.
- **Frontend API** — every backend call lives in `src/services/api.ts`, grouped by
  domain.
- **Frontend state** — a single Zustand store in `chatStore.ts`; add slices rather
  than creating new stores.
- **Frontend components** — organized by feature folder under `src/components/`.

---

## License

See repository for license details.
