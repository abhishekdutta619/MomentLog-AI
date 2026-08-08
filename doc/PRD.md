# MomentLog AI — Product Requirements Document

**Version:** 0.1 (MVP)
**Status:** Draft for build kickoff
**Owner:** Solo build — portfolio project

---

## 1. Product Overview

**MomentLog AI** is a personal life operating system built around a single core idea: the journal is the source of truth, and everything else — tasks, goals, mood, weather, AI — exists to support the act of recording and understanding a life, not to compete with it for attention.

> **Tagline:** *Remember your life. Understand yourself. Grow every day.*

### Product Philosophy (north star — filters every feature decision)

> MomentLog is a quiet personal space for recording, remembering, and understanding life. Journaling comes first. Productivity exists to support meaningful living — not maximize output. AI exists to help users discover patterns, memories, and insights — not to overwhelm or replace reflection. Privacy is fundamental, not an optional feature. Every feature should reduce friction, increase understanding, or help the user meaningfully engage with their own life. **When in doubt, choose simplicity.**

If a proposed feature doesn't strengthen *memory, reflection, understanding, or meaningful action*, it doesn't belong in the MVP — it goes on the roadmap instead.

### Why this project (portfolio context)

This is a solo-built portfolio project, developed in parallel with two other projects ([[cloudsuite-saas]], [[simply-dwell-cms]]). Its job is to demonstrate a different slice of full-stack + AI engineering ability than the other two: a polyglot backend (TypeScript + Python), relational + vector data modeling, async AI processing, and product/UX judgment — not just CRUD.

---

## 2. Goals & Success Criteria

| Goal | What "done" looks like |
|---|---|
| Ship a coherent, usable MVP | A user can journal daily, tag entries, track mood/tasks/goals, and get weather context — end to end, deployed |
| Demonstrate real AI engineering | Background embedding pipeline, semantic search ("Ask MomentLog"), and AI-generated summaries — not just a wrapped chat API call |
| Demonstrate architectural judgment | Clean separation between the app API and the AI worker, justified by workload shape, not resume-padding |
| Stay finishable | MVP scoped to be buildable in a small number of focused phases at a part-time, parallel-project pace |
| Interview-ready story | A README that explains the product philosophy, architecture, and what was deliberately deferred and why |

**Non-goal for MVP:** feature completeness against the full original vision (knowledge graph, decision journal, reflection coach, yearbook, life timeline). These are documented as roadmap, not built now.

---

## 3. Core Entity: The Moment

The fundamental unit of the product is the **Moment** (not "journal entry"). Everything else attaches to it.

```
Moment
├── Content        (text / markdown)
├── Mood            (optional, per entry)
├── Weather         (auto-attached from context at time of writing)
├── Tags
├── Media           (post-MVP: images/audio)
└── AI
    ├── Summary
    ├── Embedding (for semantic search)
    └── Extracted topics (post-MVP)
```

Navigation and product language use **"Moments,"** not "Journal," throughout the UI.

---

## 4. MVP Scope

### In scope

| Domain | Features |
|---|---|
| **Moments** | Create/edit/delete, markdown body, tags, calendar view, chronological feed |
| **Mood** | One quick check-in per Moment (5-point scale), mood calendar view |
| **Tasks** | Flat list, priority, due date, complete/incomplete — no Kanban, no subtasks |
| **Goals** | Create a goal, attach milestones, mark progress — no analytics yet |
| **Weather** | Auto-fetched and attached to each Moment based on location + timestamp; shown as a single quiet line (e.g. "☀️ 28°C · Clear"), expandable |
| **AI layer** | Background embedding on save; semantic search ("Ask MomentLog" — natural-language Q&A over past Moments with source citations); AI-generated Moment summaries |
| **Auth** | Email/password + session via Auth.js |
| **Privacy basics** | Data belongs to the user by default; export and delete account are functional, not just promised |

### Explicitly deferred (roadmap, documented in README)

Habits, Kanban/subtasks, personal knowledge graph (people/places/projects), AI Reflection Coach, AI Decision Journal, Life Timeline, Yearbook, voice journaling, offline/PWA support, Moment DNA (emotion/topic fingerprinting).

---

## 5. UX & Design Principles

**Brand personality:** Calm · Reflective · Intelligent · Trustworthy · Private · Minimal · Modern. Closer to a premium private journal than a SaaS admin dashboard.

- **Human first, AI second.** The editor is the emotional center of the app. AI surfaces as small, contextual, dismissible moments (e.g. a "✦ Reflect" prompt under an entry) — never a persistent "AI Command Center."
- **Quiet dashboard.** No grid-of-stat-cards. Morning view: greeting, date, mood check-in, today's focus (3 items max), one recent memory, one small AI insight. Evening view shifts to a reflection prompt.
- **Weather is context, not a widget.** One line, expandable on demand.
- **Typography & spacing:** geometric sans-serif, restrained weight hierarchy, generous whitespace — reference points are Apple Notes / Linear, not an enterprise dashboard.
- **Color:** no gradients. Primary `#2D3748` (deep slate blue), background `#F7FAFC` (off-white), neutral grays for secondary text/borders, a deliberately derived dark-mode palette.
- **Motion:** subtle fade/slide/scale only — communicates continuity, not excitement. If the animation is more noticeable than the content, it's too strong.
- **AI voice:** thoughtful, concise, observant, non-judgmental. *"You completed 4 of your 5 weekly goals. The unfinished goal has appeared for three consecutive weeks — reconsider it?"* — not exclamation-point cheerleading.
- **Navigation:** Home · Moments · Calendar · Tasks · Goals · Ask MomentLog · Settings. Flat, minimal.

---

## 6. Technical Architecture

### Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind + shadcn/ui | Matches modern app conventions, fast to build a restrained UI in |
| App API | Next.js Route Handlers | CRUD for Moments/Tasks/Goals/Mood — no separate service needed for this workload |
| AI worker | **FastAPI microservice** | Genuinely different workload (async embedding/LLM calls, background jobs) — Python's ecosystem fits; gives a real polyglot architecture story |
| Database | PostgreSQL + `pgvector` | Relational data (Moments↔Tasks↔Goals) plus vector search in one engine; avoids running two databases |
| ORM | Prisma | Deliberately different from [[cloudsuite-saas]]'s Drizzle, for portfolio breadth |
| Background jobs | Postgres-backed job table + polling worker (MVP) | Cheaper to build than Redis/BullMQ; teaches async/retry/idempotency without the ops overhead; upgradeable later |
| Auth | Auth.js (NextAuth) | Fast, proven path — CloudSuite already demonstrates hand-rolled JWT auth, no need to repeat |
| File/object storage | Cloudflare R2 | S3-compatible, no egress fees, consistent with [[simply-dwell-cms]]'s existing Cloudflare usage |
| Hosting | Vercel (web) + managed Postgres (Neon or Supabase, both have first-class `pgvector`) | Standard, low-ops |
| AI provider | **Open decision** — see Section 8 | — |

### System shape

```
Next.js (Route Handlers)  ──CRUD──▶  PostgreSQL + pgvector
        │
        └──enqueue job──▶  Postgres job table ──polled by──▶ FastAPI AI worker
                                                                    │
                                                            embeddings / summaries / RAG
                                                                    │
                                                             writes back to Postgres
```

A Moment save returns immediately; AI processing (embedding, summary) happens asynchronously in the FastAPI worker and appears on the Moment once complete.

---

## 7. Non-Functional Requirements

- **Privacy is a first-class feature, not a settings-page afterthought.** UI should communicate provenance where relevant (e.g. "This insight was generated from your private journal history"). Export and account deletion must actually work in the MVP.
- **Async by default for AI.** No AI call should block a user-facing request.
- **Idempotent job processing.** Retries on the AI worker shouldn't double-embed or double-summarize a Moment.

---

## 8. Open Decisions

1. **AI provider** for embeddings + summaries/RAG (Claude / OpenAI / Gemini) — not yet chosen.
2. **Weather API provider** — not yet chosen.
3. **Managed Postgres host** — Neon vs Supabase, leaning toward whichever has smoother `pgvector` + branching DX; not yet finalized.

---

## 9. Phased Build Plan (MVP)

| Phase | Focus |
|---|---|
| 0 | Product spec (this doc), ERD, repo scaffolding, API design |
| 1 | Auth, user profile, app shell/navigation, Moments CRUD (editor, tags, calendar) |
| 2 | Mood check-in, Tasks, Goals + milestones |
| 3 | Weather integration (fetch + attach to Moments) |
| 4 | FastAPI AI worker scaffolding, job queue table, background embedding pipeline |
| 5 | Semantic search ("Ask MomentLog") + AI Moment summaries |
| 6 | Privacy features (export/delete), polish, deploy, README/portfolio write-up |

Full future vision (knowledge graph, decision journal, reflection coach, yearbook, etc.) is preserved as a documented "Roadmap" section in the repo README, not in this build plan.
