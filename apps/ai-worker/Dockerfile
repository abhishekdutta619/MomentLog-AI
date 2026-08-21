FROM python:3.12-slim

WORKDIR /app

# torch, installed on its own from PyTorch's CPU-only wheel index, BEFORE
# requirements.txt. Doing it this way — rather than letting pip resolve
# torch transitively while installing requirements.txt — means by the
# time sentence-transformers/transformers ask for torch, pip finds it
# already satisfied and never falls back to the default PyPI index (which
# bundles the full CUDA/GPU stack, several GB of dead weight on a
# container that only ever runs on CPU).
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
