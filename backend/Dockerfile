# ============================================================
# STAGE 1: BUILDER
# ============================================================
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ============================================================
# STAGE 2: RUNTIME
# ============================================================
FROM python:3.12-slim

WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    ENVIRONMENT=production

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY .env.example ./.env.example
COPY pyproject.toml .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run Gunicorn with Uvicorn workers
CMD ["gunicorn", \
     "--workers=4", \
     "--worker-class=uvicorn.workers.UvicornWorker", \
     "--worker-tmp-dir=/dev/shm", \
     "--bind=0.0.0.0:8000", \
     "--timeout=120", \
     "--access-logfile=-", \
     "--error-logfile=-", \
     "--log-level=info", \
     "app.main:app"]