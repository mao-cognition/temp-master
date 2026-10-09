// 空文字のときは同一オリジン（開発時は Vite の proxy 経由でローカル FastAPI）を使う
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const REFRESH_INTERVAL_MS = 30_000

export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

export const APP_VERSION = '2.0'
