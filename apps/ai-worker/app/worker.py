"""
The polling loop. Claims a batch of PENDING AIJob rows for job types this
worker currently knows how to handle, processes each, and writes the
result back — matching docs/phase0-part3-api-design.md's Job Contract.

FOR UPDATE SKIP LOCKED is what makes this safe to eventually run more than
one worker instance without double-processing a job — worth having even
though the MVP runs a single instance.
"""

import asyncio
import logging

import asyncpg

from app.config import settings
from app.db import get_pool
from app.jobs import JOB_HANDLERS

logger = logging.getLogger("ai-worker")


async def claim_batch(pool: asyncpg.Pool) -> list[asyncpg.Record]:
    job_types = list(JOB_HANDLERS.keys())
    if not job_types:
        return []

    async with pool.acquire() as conn:
        return await conn.fetch(
            """
            UPDATE "AIJob" SET status = 'PROCESSING', "updatedAt" = now()
            WHERE id IN (
              SELECT id FROM "AIJob"
              WHERE status = 'PENDING' AND type = ANY($1::"AIJobType"[])
              ORDER BY "createdAt"
              LIMIT $2
              FOR UPDATE SKIP LOCKED
            )
            RETURNING id, "momentId", type, attempts
            """,
            job_types,
            settings.batch_size,
        )


async def mark_done(pool: asyncpg.Pool, job_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE "AIJob" SET status = 'DONE', "updatedAt" = now() WHERE id = $1""",
            job_id,
        )


async def mark_failed(pool: asyncpg.Pool, job_id: str, attempts: int, error: str) -> None:
    # Simple retry policy for MVP (matches the API design doc): attempts
    # increments on every failure; back to PENDING to retry next poll while
    # under the cap, FAILED for good once the cap is hit. Either way the
    # Moment itself is untouched — it just won't have a summary/embedding
    # yet, so nothing user-facing breaks.
    next_status = "PENDING" if attempts + 1 < settings.max_attempts else "FAILED"
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE "AIJob"
            SET status = $2, attempts = attempts + 1, error = $3, "updatedAt" = now()
            WHERE id = $1
            """,
            job_id,
            next_status,
            error[:2000],
        )


async def process_job(pool: asyncpg.Pool, job: asyncpg.Record) -> None:
    handler = JOB_HANDLERS[job["type"]]
    try:
        await handler(job["momentId"])
        await mark_done(pool, job["id"])
        logger.info("job done: %s (%s)", job["id"], job["type"])
    except Exception as exc:  # noqa: BLE001 — any handler failure is a job failure
        await mark_failed(pool, job["id"], job["attempts"], str(exc))
        logger.exception("job failed: %s (%s)", job["id"], job["type"])


async def run_forever() -> None:
    pool = await get_pool()
    logger.info(
        "worker started — polling every %ss for %s",
        settings.poll_interval_seconds,
        list(JOB_HANDLERS.keys()),
    )
    while True:
        jobs = await claim_batch(pool)
        for job in jobs:
            await process_job(pool, job)
        if not jobs:
            await asyncio.sleep(settings.poll_interval_seconds)
