"""
Job handler registry. The polling loop only claims AIJob rows whose type
has an entry here — so a job type without a handler yet is simply left
PENDING and untouched, rather than being claimed and burning through its
retry budget for lack of an implementation.
"""

from app.jobs.embed import run_embed
from app.jobs.summarize import run_summarize

JOB_HANDLERS = {
    "EMBED": run_embed,
    "SUMMARIZE": run_summarize,
}
