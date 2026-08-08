# MomentLog AI — Repo Structure (Phase 0, Part 2)

## Layout

```
momentlog-ai/
├── prisma/
│   └── schema.prisma          # single source of truth for BOTH services
│
├── apps/
│   ├── web/                   # Next.js — frontend + Route Handlers (app API)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/            # login/signup routes
│   │   │   │   ├── (app)/             # authenticated app shell
│   │   │   │   │   ├── moments/
│   │   │   │   │   ├── calendar/
│   │   │   │   │   ├── tasks/
│   │   │   │   │   ├── goals/
│   │   │   │   │   └── ask/           # "Ask MomentLog"
│   │   │   │   └── api/               # Route Handlers
│   │   │   │       ├── auth/[...nextauth]/
│   │   │   │       ├── moments/
│   │   │   │       ├── tags/
│   │   │   │       ├── tasks/
│   │   │   │       ├── goals/
│   │   │   │       └── ai/ask/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   │   ├── db.ts              # Prisma client singleton
│   │   │   │   ├── ai.ts              # embedding + LLM calls for the sync "ask" flow
│   │   │   │   └── weather.ts
│   │   │   └── styles/
│   │   ├── .env.local
│   │   └── package.json               # prisma generate points at ../../prisma/schema.prisma
│   │
│   └── ai-worker/             # FastAPI — async background AI processing ONLY
│       ├── app/
│       │   ├── main.py                # FastAPI app (health check only — no public API surface)
│       │   ├── worker.py              # polling loop: claims PENDING AIJob rows
│       │   ├── jobs/
│       │   │   ├── embed.py
│       │   │   └── summarize.py
│       │   └── db.py                  # prisma-client-py, generated from ../../prisma/schema.prisma
│       ├── requirements.txt
│       └── Dockerfile
│
├── docs/
│   ├── PRD.md
│   ├── ERD.mermaid
│   └── ROADMAP.md             # everything deferred out of MVP, with rationale
│
├── docker-compose.yml         # local Postgres (w/ pgvector) + web + ai-worker
├── .github/workflows/ci.yml
└── README.md                  # product philosophy, architecture, what's deferred + why
```

## Why this shape

- **No Turborepo/Nx here.** CloudSuite already demonstrates a JS/TS monorepo toolchain — repeating it wouldn't teach anything new, and it doesn't actually help across a Node+Python split anyway (those tools don't manage Python workspaces). A plain two-`apps/` layout with a shared top-level `prisma/` is simpler and honest about what it is.
- **`ai-worker` has no public API surface in the MVP.** It only reads/writes the `AIJob` table. This keeps the architecture boundary crisp: *Next.js owns everything request/response; the worker owns everything async.* (See Part 3 — the synchronous "Ask MomentLog" flow lives in Next.js, not the worker, for exactly this reason.)
- **`docker-compose.yml` at the root** brings up Postgres+pgvector, the web app, and the worker together for local dev — one command to get a full stack running, which matters when you're context-switching between three projects.
- **`docs/ROADMAP.md`** is where the full original vision (knowledge graph, decision journal, reflection coach, yearbook) lives — explicitly written up as "considered and deferred," not silently dropped. That's the artifact that turns scope-cutting into a strength in an interview instead of looking like an unfinished app.

## Local dev environment variables (`apps/web/.env.local`)

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
AI_PROVIDER_API_KEY=       # once Section 8's open decision is settled
WEATHER_API_KEY=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
```

`ai-worker` reads the same `DATABASE_URL` and `AI_PROVIDER_API_KEY` via its own `.env`, kept separate from the web app's since it's a separate deployable.
