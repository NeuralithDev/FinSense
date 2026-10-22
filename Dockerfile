# ==============================================================================
# FinSense Multi-Stage Production Dockerfile
# Stage 1: Build React 19 / Vite Frontend
# Stage 2: Build FastAPI + PyTorch Python 3.12 Backend & Serve Static Bundle
# ==============================================================================

FROM node:20-alpine AS frontend-builder
WORKDIR /build

# Copy dependency manifests
COPY app/frontend/package*.json ./
RUN npm ci --silent || npm install --silent

# Copy frontend source code & build
COPY app/frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Python 3.12 Slim Runtime
# ==============================================================================
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

# Install system dependencies (curl for healthcheck, libsqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies with CPU-optimized PyTorch
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code and pre-trained weights
COPY src/ /app/src/
COPY app/ /app/app/
COPY models/ /app/models/
COPY data/ /app/data/
COPY scripts/ /app/scripts/

# Copy compiled frontend dist from Stage 1 into FastAPI's static path
COPY --from=frontend-builder /build/dist /app/app/frontend/dist

# Ensure data and models directories exist and are writable
RUN mkdir -p /app/data /app/models/trained

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
