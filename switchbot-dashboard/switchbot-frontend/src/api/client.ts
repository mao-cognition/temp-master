import { API_BASE_URL } from '../config'
import type { HistoryResponse, MetersResponse, RefreshResponse, StatusResponse, TimeScale } from '../types'

export interface ApiClient {
  getMeters(): Promise<MetersResponse>
  getStatus(): Promise<StatusResponse>
  getHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse>
  refresh(): Promise<RefreshResponse>
  backupUrl(): string | null
}

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let detail = res.statusText || `HTTP ${res.status}`
    try {
      const body: unknown = await res.json()
      if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
        detail = body.detail
      }
    } catch {
      // JSON でないエラーレスポンスは statusText を使う
    }
    throw new ApiError(res.status, detail)
  }
  return (await res.json()) as T
}

export const httpClient: ApiClient = {
  getMeters: () => request<MetersResponse>('/api/meters'),
  getStatus: () => request<StatusResponse>('/api/status'),
  getHistory: (deviceId, timeScale) =>
    request<HistoryResponse>(
      `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${encodeURIComponent(timeScale)}`,
    ),
  refresh: () => request<RefreshResponse>('/api/meters/refresh', { method: 'POST' }),
  backupUrl: () => `${API_BASE_URL}/api/backup`,
}

// モックモードのときだけモック実装を動的に読み込む（本番バンドルには含まれない）
export async function loadApiClient(): Promise<ApiClient> {
  // import.meta.env を直接参照し、ビルド時に分岐ごと除去されるようにする
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { createMockClient } = await import('./mock')
    return createMockClient(new URLSearchParams(window.location.search).get('scenario'))
  }
  return httpClient
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
