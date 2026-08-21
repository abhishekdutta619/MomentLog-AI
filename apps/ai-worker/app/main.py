"""
FastAPI app for the AI worker.

Per docs/phase0-part2-repo-structure.md: no public API surface in the
MVP — the health check exists for container orchestration, not for the
frontend to call. The actual work (draining the AIJob queue) runs as a
background asyncio task inside this same process, started on lifespan
startup — `uvicorn app.main:app` is the one command that runs both.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db import close_pool, get_pool
from app.worker import run_forever

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()  # fail fast on startup if DATABASE_URL is unreachable
    polling_task = asyncio.create_task(run_forever())
    yield
    polling_task.cancel()
    await close_pool()


app = FastAPI(title="MomentLog AI Worker", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok"}
