"""
Environment-driven settings for the AI worker.

Fully local — no external AI provider, no API key, no billing account for
this service at all. Only DATABASE_URL is required; everything else has a
default that works out of the box.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str

    # sentence-transformers, downloaded from Hugging Face once and cached
    # after that. 384-dim output — must match prisma/schema.prisma's
    # MomentEmbedding.vector column exactly (vector(384)), or every
    # semantic-search query fails with a dimension-mismatch error.
    embedding_model: str = "all-MiniLM-L6-v2"

    # transformers — the same library sentence-transformers already
    # depends on, so this doesn't add a new heavy dependency on top of
    # embeddings. A small instruct model, chosen for CPU inference speed
    # over raw quality; revisit here first if summaries feel too weak.
    generation_model: str = "Qwen/Qwen2.5-1.5B-Instruct"
    generation_max_new_tokens: int = 120

    # Polling loop tuning. 5s keeps "Ask MomentLog" freshness reasonable
    # for a single-user MVP without hammering the DB.
    poll_interval_seconds: float = 5.0
    batch_size: int = 10
    max_attempts: int = 3


settings = Settings()
