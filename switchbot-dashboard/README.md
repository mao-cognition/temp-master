# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Recharts
- Time scale switching (hour/day/month/year)
- Auto-refresh every 30 seconds (frontend) with background data collection every 2 minutes (backend)
- Rate limiting protection with exponential backoff
- All API calls are cached - GET endpoints never call SwitchBot API directly

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd switchbot-backend
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Copy `.env.example` to `.env` and add your SwitchBot credentials:
   ```bash
   cp .env.example .env
   ```
   
   Get your credentials from the SwitchBot app:
   - Go to Profile > Preferences > About
   - Tap App Version 10 times to enable Developer Options
   - Go to Developer Options > Get Token

4. Start the development server:
   ```bash
   poetry run fastapi dev app/main.py
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd switchbot-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration
- `POST /api/import` - 他インスタンスからのデータ取り込み（管理系 API・要 `X-API-Key`）
- `GET /api/backup` - SQLite DB ファイルのダウンロード（管理系 API・要 `X-API-Key`）

### 管理系 API の認証（ADMIN_API_KEY）

`POST /api/import` と `GET /api/backup` は、リクエストヘッダ `X-API-Key` が環境変数 `ADMIN_API_KEY` と一致する場合のみ実行できます。

- `ADMIN_API_KEY` が未設定（空）の場合、管理系 API は常に `503` を返します（fail-closed）。
- キーが無い・間違っている場合は `401` を返します。

ローカルでは `switchbot-backend/.env` に設定します:

```bash
ADMIN_API_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
```

本番（Fly.io）では `.env` ではなく Fly の secrets に設定します（設定するとマシンが再起動されます）:

```bash
fly secrets set ADMIN_API_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')" -a temp-master
fly secrets list -a temp-master   # ADMIN_API_KEY が表示されることを確認
```

呼び出し例:

```bash
curl -H "X-API-Key: $ADMIN_API_KEY" -o backup.db https://temp-master.fly.dev/api/backup
```

`backup_database.sh` を使う場合は、同じ値を環境変数 `BACKUP_API_KEY` に設定して実行します:

```bash
BACKUP_API_KEY="<ADMIN_API_KEY と同じ値>" ./backup_database.sh
```

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
