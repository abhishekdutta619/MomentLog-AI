"""
EMBED job: fetch the Moment's content, get an embedding from a local
sentence-transformers model, and upsert it into MomentEmbedding.

Fully local — no API key, no network call after the model's first
download. Weights (~90MB) are pulled from Hugging Face once on first
startup and cached inside the container after that; every run after the
first is fully offline.

Upsert (not insert) because PATCH /api/moments/:id re-enqueues this job
whenever content changes — momentId is unique on MomentEmbedding, so a
second EMBED job for the same Moment replaces the stale vector instead of
erroring on a duplicate key.
"""

import asyncio
import uuid

from sentence_transformers import SentenceTransformer

from app.config import settings
from app.db import get_pool

# Loaded once at import time (worker startup), not per job — loading is
# the expensive part (~1-2s on CPU); encoding a single Moment after that
# is fast.
_model = SentenceTransformer(settings.embedding_model)


async def run_embed(moment_id: str) -> None:
    pool = await get_pool()

    async with pool.acquire() as conn:
        moment = await conn.fetchrow(
            'SELECT content FROM "Moment" WHERE id = $1', moment_id
        )

    if moment is None:
        # Moment was deleted after the job was enqueued but before the
        # worker got to it (DELETE cascades AIJob rows too, but a race is
        # still possible) — nothing to embed, and not a failure.
        return

    # model.encode() is a blocking, CPU-bound call. worker.py's poll loop
    # awaits job handlers one at a time on a single event loop, so calling
    # this directly would stall everything else — including /health — for
    # however long it takes. asyncio.to_thread moves it onto a worker
    # thread instead of blocking the loop.
    vector = await asyncio.to_thread(_model.encode, moment["content"])
    vector_literal = "[" + ",".join(str(v) for v in vector.tolist()) + "]"

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO "MomentEmbedding" (id, "momentId", vector, model, "createdAt")
            VALUES ($1, $2, $3::vector, $4, now())
            ON CONFLICT ("momentId")
            DO UPDATE SET vector = EXCLUDED.vector,
                           model = EXCLUDED.model,
                           "createdAt" = now()
            """,
            str(uuid.uuid4()),
            moment_id,
            vector_literal,
            settings.embedding_model,
        )
