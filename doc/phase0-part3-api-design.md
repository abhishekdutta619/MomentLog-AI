# MomentLog AI — API Design (Phase 0, Part 3)

## Architecture boundary (the one rule that shapes everything below)

> **Next.js Route Handlers own every request/response the user waits on — including "Ask MomentLog." The FastAPI worker owns only async background work and is never called synchronously by the frontend.**

This is why "Ask MomentLog" (semantic search + RAG) lives in `apps/web/api/ai/ask`, not in the worker: it's latency-sensitive and user-facing, so it belongs with the rest of the request/response API. The worker's only job is to drain the `AIJob` queue in the background.

---

## 1. Next.js Route Handlers (`apps/web/src/app/api/`)

### Auth
Handled entirely by Auth.js — `/api/auth/[...nextauth]`.

### Moments
| Method | Route | Notes |
|---|---|---|
| `POST` | `/api/moments` | Creates a Moment. Fetches weather server-side and attaches it. On success, enqueues `AIJob` rows (`EMBED`, `SUMMARIZE`) in the same DB transaction. |
| `GET` | `/api/moments` | Paginated list. Query params: `tag`, `from`, `to`, `cursor`. |
| `GET` | `/api/moments/:id` | Single Moment, including `aiSummary` and tags. |
| `PATCH` | `/api/moments/:id` | Update content/mood/tags. If `content` changes, re-enqueues `EMBED` + `SUMMARIZE` jobs (old embedding is stale). |
| `DELETE` | `/api/moments/:id` | Cascades to embedding + jobs via DB relation. |
| `GET` | `/api/moments/calendar?month=YYYY-MM` | Returns day → mood/entry-count map for the calendar view. |

### Tags
| Method | Route |
|---|---|
| `GET` | `/api/tags` |
| `POST` | `/api/tags` |

### Tasks
| Method | Route |
|---|---|
| `GET` / `POST` | `/api/tasks` |
| `PATCH` / `DELETE` | `/api/tasks/:id` |

### Goals
| Method | Route |
|---|---|
| `GET` / `POST` | `/api/goals` |
| `PATCH` / `DELETE` | `/api/goals/:id` |
| `POST` | `/api/goals/:id/milestones` |
| `PATCH` / `DELETE` | `/api/goals/:id/milestones/:milestoneId` |

### AI (synchronous, user-facing)
| Method | Route | Notes |
|---|---|---|
| `POST` | `/api/ai/ask` | Body: `{ question: string }`. Embeds the question, runs `$queryRaw` cosine-distance search against `MomentEmbedding`, sends top-k Moments + question to the LLM, returns `{ answer, sourceMoments: [...] }`. |

### Weather (supporting)
| Method | Route | Notes |
|---|---|---|
| `GET` | `/api/weather/current` | Used by the Moment editor to preview weather before saving; the actual attach-to-Moment fetch happens server-side inside `POST /api/moments`, not from this endpoint. |

---

## 2. The Job Contract (Next.js ↔ FastAPI worker)

Both sides only ever touch the `AIJob` table — there's no HTTP call between them.

**Producer side (Next.js, inside `POST`/`PATCH /api/moments`):**
```ts
await prisma.$transaction([
  prisma.moment.upsert(/* ... */),
  prisma.aIJob.create({ data: { momentId, type: "EMBED" } }),
  prisma.aIJob.create({ data: { momentId, type: "SUMMARIZE" } }),
]);
```

**Consumer side (FastAPI worker, `worker.py` polling loop):**
```python
# Claim a batch of pending jobs, skipping any another process already locked
jobs = db.query_raw(
    """
    UPDATE "AIJob" SET status = 'PROCESSING', "updatedAt" = now()
    WHERE id IN (
      SELECT id FROM "AIJob"
      WHERE status = 'PENDING'
      ORDER BY "createdAt"
      LIMIT 10
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
    """
)

for job in jobs:
    try:
        if job.type == "EMBED":
            run_embed(job.momentId)
        elif job.type == "SUMMARIZE":
            run_summarize(job.momentId)
        mark_done(job.id)
    except Exception as e:
        mark_failed(job.id, error=str(e))  # attempts += 1; simple retry policy for MVP
```

`FOR UPDATE SKIP LOCKED` is the detail that makes this safe to eventually run more than one worker instance without double-processing a job — worth having even though MVP runs a single worker.

**Result write-back:**
- `EMBED` job → upserts `MomentEmbedding` (vector + model name)
- `SUMMARIZE` job → updates `Moment.aiSummary`

---

## 3. Error handling & retries (MVP policy)

- `AIJob.attempts` increments on every failure. Worker gives up after 3 attempts and leaves the job `FAILED` — the Moment still works fine without a summary/embedding, it just won't show up in "Ask MomentLog" results or won't have an AI summary. Nothing user-facing breaks.
- No dead-letter table for MVP — `FAILED` rows are just queryable directly if you need to debug later.

---

## Still open before this can run end-to-end

Same three from the PRD — AI provider, weather API, Postgres host. `POST /api/moments`, `/api/ai/ask`, and the worker's `run_embed`/`run_summarize` all have a provider-shaped hole in them until those are picked.
