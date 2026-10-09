# ---- Stage 1: フロントエンド（React + Vite）をビルド ----
FROM node:22-slim AS frontend
WORKDIR /frontend

COPY switchbot-frontend/package.json switchbot-frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY switchbot-frontend/ ./
RUN npm run build

# ---- Stage 2: バックエンドを起動（ビルド済みフロントエンドを配信） ----
FROM python:3.12-slim
WORKDIR /app

# Install poetry
RUN pip install poetry

# Copy and install backend dependencies
COPY switchbot-backend/pyproject.toml switchbot-backend/poetry.lock ./
RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true && \
    poetry install --only main --no-root --no-interaction --no-ansi

# Copy backend application code
COPY switchbot-backend/app/ ./app/

# ビルド済みフロントエンド（dist）を static に配置: "/" で配信される
COPY --from=frontend /frontend/dist/ ./static/

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
