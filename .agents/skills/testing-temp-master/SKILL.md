---
name: testing-temp-master
description: Test the Temp Master SwitchBot dashboard locally. Use when verifying UI changes, API connectivity, or branding updates.
---

# Testing Temp Master Dashboard

## Prerequisites

- Python 3.12+
- Node.js 20.19+ (22 recommended)
- Poetry (dependency management)
- SwitchBot API credentials (optional; without them use the mock mode)

## Devin Secrets Needed

- `SWITCHBOT_TOKEN` - SwitchBot API token
- `SWITCHBOT_SECRET` - SwitchBot API secret

## Local Development Setup

### 1. Install dependencies

```bash
cd switchbot-dashboard/switchbot-backend
poetry install --no-interaction
```

### 2. Create .env file

```bash
cd switchbot-dashboard/switchbot-backend
echo "SWITCHBOT_TOKEN=${SWITCHBOT_TOKEN}" > .env
echo "SWITCHBOT_SECRET=${SWITCHBOT_SECRET}" >> .env
```

### 3. Build the frontend and symlink it as static files

The frontend is a React + Vite app. The Dockerfile builds it and copies `dist/` to `static/`. Locally, build it and symlink `dist/`:

```bash
cd switchbot-dashboard/switchbot-frontend && npm ci && npm run build:same-origin && cd -
ln -sfn $(pwd)/switchbot-dashboard/switchbot-frontend/dist switchbot-dashboard/switchbot-backend/static
```

`npm run build` (production) fetches data from `https://snakeroom.fly.dev` (`.env.production`); `build:same-origin` uses the FastAPI it is served from.

Without SwitchBot credentials, use mock data: `cd switchbot-dashboard/switchbot-frontend && npm run dev:mock` (http://localhost:5173, `?scenario=unconfigured|rate-limited|error`).

**Important:** The static directory check in `main.py` happens at module import time (`STATIC_DIR = Path(__file__).resolve().parent.parent / "static"`). If you create the symlink after starting the server, you must restart the server.

### 4. Start the server

```bash
cd switchbot-dashboard/switchbot-backend
poetry run fastapi run app/main.py --host 0.0.0.0 --port 8000
```

The frontend is served at `http://localhost:8000/` and the API docs at `http://localhost:8000/docs`.

## Key Test Points

### Branding Verification
- Page title (`<title>` tag): should say "Temp Master Dashboard"
- Navbar brand: should say "Temp Master Dashboard"
- Footer: should say "Temp Master Dashboard v2.0 - Built with React 19 + Vite + TypeScript + Chart.js 4"
- Verify no "Snake" or "SnakeRoom" text exists anywhere: `document.body.innerHTML.includes('Snake')` should be `false`

### API Connectivity
- `GET /api/status` returns `configured: true` and `meters_count` > 0
- `GET /api/meters` returns live meter data with temperature, humidity, battery
- Connection status badge (`#connection-status`) shows "Connected" (green, class `badge--success`)

### UI Functionality
- Theme switcher (navbar): ライト / ダーク / システム, sets `<html data-theme>` and persists in localStorage (`temp-master-theme`)
- Time Range selector: Last Hour / Last 24 Hours / Last 7 Days / Last 30 Days / Last Year
- Charts: Canvas elements rendered with Chart.js line charts
- Refresh Data button triggers data reload

## Running Backend Tests

```bash
cd switchbot-dashboard/switchbot-backend
poetry run pytest -v
```

Expected: 97 tests pass.

## Architecture Notes

- Backend: FastAPI + aiosqlite (SQLite persistence at `/data/app.db` or local `app.db`)
- Frontend: React 19 + Vite + TypeScript + Chart.js 4 (`switchbot-frontend/`, built to `dist/`)
- Deployment: Fly.io (see `fly.toml`)
- Background data collection runs with 120s interval, with rate limiting and exponential backoff
