"""
Postgres access for the worker, via asyncpg — not prisma-client-py.

prisma/schema.prisma originally noted that this service would use
prisma-client-py so both services could share one generated client. That
package is no longer maintained (see the Phase 4 guide.md for the writeup),
so the worker talks to the same DATABASE_URL directly instead. It only ever
needs a handful of narrow queries — claim jobs, read a Moment, write back an
embedding/summary — so a full ORM isn't buying much here anyway.

Table and column names below are quoted to match Prisma's default casing
exactly (e.g. "AIJob", "momentId"), since this is the same database Prisma
manages the schema for.
"""

import asyncpg

from app.config import settings

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=1,
            max_size=5,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
