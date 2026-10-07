# Temp Master Dashboard

A fullstack web dashboard to monitor temperature readings from SwitchBot Meter devices.

## Features

- Temperature charts for all SwitchBot Meter devices using Chart.js (React)
- Light / Dark / System theme switching
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

React 19 + Vite + TypeScript + Chart.js 4 で構成されたシングルページアプリです。Node.js 20.19 以上（推奨 22）が必要です。

1. フロントエンドのディレクトリに移動して依存関係をインストールします:
   ```bash
   cd switchbot-frontend
   npm install
   ```

2. 開発サーバーを起動します（`/api` はローカルの FastAPI `http://localhost:8000` にプロキシされます）:
   ```bash
   npm run dev
   ```

   SwitchBot の認証情報が無い環境では、モックデータで UI を確認できます:
   ```bash
   npm run dev:mock
   ```
   `?scenario=unconfigured` / `?scenario=rate-limited` / `?scenario=error` を URL に付けると各状態を再現できます。

3. http://localhost:5173 をブラウザで開きます。画面右上のボタンでテーマ（ライト / ダーク / システム）を切り替えられます。

| コマンド | 内容 |
| --- | --- |
| `npm run build` | 本番ビルド（`dist/`）。データ取得先は `.env.production` の `VITE_API_BASE_URL` |
| `npm run build:same-origin` | 配信元の FastAPI と同一オリジンの API を使うビルド |
| `npm run lint` / `npm run typecheck` / `npm test` | oxlint / TypeScript / Vitest |

#### FastAPI からビルド済みフロントエンドを配信する

FastAPI は `switchbot-backend/static/` が存在すればその中身を `/` で配信します。Docker イメージではマルチステージビルドで `dist/` を `static/` にコピーします。ローカルでは次のようにシンボリックリンクを張ってからバックエンドを起動します:

```bash
cd switchbot-frontend && npm run build:same-origin && cd ..
ln -sfn "$(pwd)/switchbot-frontend/dist" switchbot-backend/static
```

## API Endpoints

- `GET /api/meters` - Returns list of all meter devices with current temperature (from cache)
- `GET /api/meters/{device_id}/history` - Returns temperature history with time_scale parameter
- `POST /api/meters/refresh` - Triggers immediate data collection
- `GET /api/status` - Returns backend status and configuration

## Notes

- Temperature history is stored in memory and resets on backend restart
- Backend data collection interval: 2 minutes minimum
- Frontend refresh interval: 30 seconds
- SwitchBot API has strict rate limits (~10000 requests/day)
