"""
SUMMARIZE job: fetch the Moment's content, ask a small local instruct
model for a short reflective summary, and write it to Moment.aiSummary.

Fully local — no API key, no network call after the model's first
download (weights pulled from Hugging Face once, cached after that).
Uses `transformers` directly rather than a separate inference stack
(e.g. llama-cpp-python or Ollama): sentence-transformers already pulls in
`transformers` as a dependency for embeddings, so this doesn't add a new
heavy package or a second container — just a second use of a library
that's already there.

Tone is deliberate, not incidental — the brand doc treats AI as "small
contextual insights," not a prominent feature, so the summary should read
like a quiet observation a thoughtful friend would make, not a report.
"""

import asyncio

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from app.config import settings
from app.db import get_pool

# Loaded once at import time, same reasoning as embed.py. bfloat16 roughly
# halves memory versus the default float32 — worth it on CPU where RAM is
# the binding constraint, not compute precision. If this model is too
# heavy for your machine, swap generation_model in config.py for
# something smaller (e.g. a 0.5B-parameter instruct model) before
# reaching for a different library.
_tokenizer = AutoTokenizer.from_pretrained(settings.generation_model)
_model = AutoModelForCausalLM.from_pretrained(
    settings.generation_model, dtype=torch.bfloat16
)

_SYSTEM_PROMPT = (
    "You write a one or two sentence reflection on a personal journal "
    "entry, in a calm, warm, second-person voice (\"You...\"). Notice what "
    "the entry is really about underneath the events — a feeling, a "
    "pattern, a shift in tone — the way a thoughtful friend would, not a "
    "report or a bullet list. Never restate the entry verbatim. If the "
    "entry is short or sparse, keep the reflection equally short rather "
    "than padding it out. Output only the reflection itself, nothing else."
)


def _generate(content: str) -> str:
    # Blocking, CPU-bound — called via asyncio.to_thread below, same
    # reasoning as embed.py's model.encode() call.
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": content},
    ]
    prompt = _tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = _tokenizer(prompt, return_tensors="pt")

    with torch.no_grad():
        output = _model.generate(
            **inputs,
            max_new_tokens=settings.generation_max_new_tokens,
            do_sample=True,
            temperature=0.7,
            pad_token_id=_tokenizer.eos_token_id,
        )

    generated_tokens = output[0][inputs["input_ids"].shape[1]:]
    return _tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()


async def run_summarize(moment_id: str) -> None:
    pool = await get_pool()

    async with pool.acquire() as conn:
        moment = await conn.fetchrow(
            'SELECT content FROM "Moment" WHERE id = $1', moment_id
        )

    if moment is None:
        # Same race as embed.py: Moment deleted after enqueue, before claim.
        return

    summary = await asyncio.to_thread(_generate, moment["content"])

    async with pool.acquire() as conn:
        await conn.execute(
            'UPDATE "Moment" SET "aiSummary" = $1, "updatedAt" = now() WHERE id = $2',
            summary,
            moment_id,
        )
