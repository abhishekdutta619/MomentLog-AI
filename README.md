# MomentLog AI

![MomentLog AI](./docs/brand/logo-lockup.png)

> Remember your life. Understand yourself. Grow every day.

An AI-powered personal journal and life-assistant platform. The journal — a **Moment** — is the core data layer; tasks, goals, mood, and weather all attach to it, and a background AI layer turns the accumulated Moments into a searchable personal memory system.

**Status:** In active development (portfolio project, built solo).

---

## Product Philosophy

> MomentLog is a quiet personal space for recording, remembering, and understanding life. Journaling comes first. Productivity exists to support meaningful living — not maximize output. AI exists to help users discover patterns, memories, and insights — not to overwhelm or replace reflection. Privacy is fundamental, not an optional feature. Every feature should reduce friction, increase understanding, or help the user meaningfully engage with their own life. **When in doubt, choose simplicity.**

This is the filter every feature in this repo is measured against — including which features got cut from the MVP (see Roadmap below).

---

## Features

### MVP

| Domain | Status |
|---|---|
| Auth (email/password, sessions) | ✅ Done |
| App shell & navigation | 🚧 In progress |
| Moments (journal CRUD, markdown, tags, calendar) | ⏳ Planned |
| Mood check-in | ⏳ Planned |
| Tasks | ⏳ Planned |
| Goals & milestones | ⏳ Planned |
| Weather context | ⏳ Planned |
| AI: background embedding pipeline | ⏳ Planned |
| AI: semantic search ("Ask MomentLog") | ⏳ Planned |
| AI: Moment summaries | ⏳ Planned |
| Privacy: data export & account deletion | ⏳ Planned |

### Roadmap (deliberately deferred)

These were part of the original product vision but didn't survive the "does this strengthen memory, reflection, understanding, or meaningful action?" filter for a v1 — not because they're bad ideas, but because an MVP that ships beats a vision that doesn't:

- **Habits** — tracking + streaks
- **Personal Knowledge Graph** — people, places, projects extracted from Moments
- **AI Reflection Coach** — guided post-entry reflection prompts
- **AI Decision Journal** — predictions logged and reviewed against outcomes later
- **Life Timeline** — auto-generated chronological view across years
- **AI Yearbook** — end-of-year generated retrospective
- **Voice journaling**, **Moment DNA** (emotion/topic fingerprinting), **offline/PWA support**

Full detail on each lives in [`docs/PRD.md`](./docs/PRD.md).

---

## Architecture

```
Next.js (Route Handlers)  ──CRUD──▶  PostgreSQL + pgvector
        │
        └──enqueue job──▶  Postgres job table ──polled by──▶ FastAPI AI worker
                                                                    │
                                                            embeddings / summaries / RAG
                                                                    │
                                                             writes back to Postgres
```

**The one rule that shapes the whole system:** Next.js Route Handlers own every request/response the user waits on — including the AI chat endpoint. The FastAPI worker only drains a background job queue; it has no public API surface and is never called synchronously from the frontend. A Moment save returns immediately, and AI processing happens asynchronously.

Full design rationale: [`docs/PRD.md`](./docs/PRD.md), [`docs/phase0-part3-api-design.md`](./docs/phase0-part3-api-design.md).

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| App API | Next.js Route Handlers |
| AI worker | FastAPI (Python) — async embeddings, summaries, RAG |
| Database | PostgreSQL + `pgvector` |
| ORM | Prisma — single `schema.prisma` shared by both services |
| Auth | Auth.js (NextAuth v5), credentials provider |
| Background jobs | Postgres-backed job table + polling worker |
| File storage | Cloudflare R2 |
| Hosting | Vercel (web), managed Postgres |

---

## Known Limitations

Tracked deliberately, not overlooked:

- **No rate limiting on `/api/auth/register` or the credentials login flow.** Fine for local development; needs a per-IP/per-email throttle before this is ever exposed publicly. Tracked for Phase 6 (production hardening).
- **`sharp` is a direct dependency but isn't called anywhere in the app yet.** It's pinned via `overrides` as part of the npm audit fix (see commit history) and is what Next.js's built-in image optimizer (`next/image`) would use once that's introduced, or R2 avatar handling later. Not dead weight — just not exercised yet.

---

## Project Structure

```
momentlog-ai/
├── prisma/
│   └── schema.prisma          # single source of truth for both services
├── apps/
│   ├── web/                   # Next.js — frontend + Route Handlers
│   └── ai-worker/             # FastAPI — async AI processing (added in a later phase)
├── docs/
│   ├── PRD.md
│   ├── ERD.mermaid
│   └── phase0-part3-api-design.md
├── docker-compose.yml         # local Postgres + pgvector
├── package.json               # npm workspaces root
└── README.md
```

---

## Getting Started

1. **Start Postgres:**
   ```bash
   docker compose up -d
   ```
2. **Install dependencies** (run from the repo root — this is an npm workspace):
   ```bash
   npm install
   ```
3. **Configure environment:** copy `apps/web/.env.example` to `apps/web/.env.local`, set `DATABASE_URL` to `postgresql://momentlog:momentlog@localhost:5432/momentlog`, and generate `AUTH_SECRET` with `openssl rand -base64 32`.
4. **Push the schema:**
   ```bash
   npm run db:push --workspace=apps/web
   ```
5. **Run the app:**
   ```bash
   npm run dev --workspace=apps/web
   ```
   Visit `localhost:3000`.

---

## License

MIT
