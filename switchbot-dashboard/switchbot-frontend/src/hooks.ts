import { useCallback, useEffect, useRef, useState } from 'react'
import { useApi } from './api/ApiContext'
import { errorMessage, type ApiClient } from './api/client'
import { REFRESH_INTERVAL_MS } from './config'
import type { Meter, Reading, StatusResponse, TimeScale } from './types'

export interface DashboardData {
  meters: Meter[]
  status: StatusResponse | null
  loading: boolean
  error: string | null
  connected: boolean
  lastRefresh: Date | null
  // 取得成功のたびに増える。チャートの履歴再取得トリガーに使う
  revision: number
}

const INITIAL: DashboardData = {
  meters: [],
  status: null,
  loading: true,
  error: null,
  connected: false,
  lastRefresh: null,
  revision: 0,
}

type FetchResult = { ok: true; meters: Meter[]; status: StatusResponse } | { ok: false; message: string }

async function fetchDashboard(api: ApiClient): Promise<FetchResult> {
  try {
    const [metersResp, status] = await Promise.all([api.getMeters(), api.getStatus()])
    return { ok: true, meters: metersResp.meters ?? [], status }
  } catch (err) {
    return { ok: false, message: `Failed to fetch data: ${errorMessage(err)}` }
  }
}

function applyResult(prev: DashboardData, result: FetchResult): DashboardData {
  if (!result.ok) {
    return { ...prev, loading: false, error: result.message, connected: false }
  }
  return {
    meters: result.meters,
    status: result.status,
    loading: false,
    error: null,
    connected: true,
    lastRefresh: new Date(),
    revision: prev.revision + 1,
  }
}

export function useDashboardData(): DashboardData & { reload: () => Promise<void> } {
  const api = useApi()
  const [data, setData] = useState<DashboardData>(INITIAL)
  const mounted = useRef(true)
  // 自動更新と手動更新が重なったとき、最後に開始した取得の結果だけを反映する
  const latestRequestId = useRef(0)

  const reload = useCallback(() => {
    const requestId = ++latestRequestId.current
    return fetchDashboard(api).then((result) => {
      if (mounted.current && requestId === latestRequestId.current) {
        setData((prev) => applyResult(prev, result))
      }
    })
  }, [api])

  useEffect(() => {
    mounted.current = true
    void reload()
    const id = window.setInterval(() => void reload(), REFRESH_INTERVAL_MS)
    return () => {
      mounted.current = false
      window.clearInterval(id)
    }
  }, [reload])

  return { ...data, reload }
}

type HistoryState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; timeScale: TimeScale; readings: Reading[] }

export function useMeterHistory(deviceId: string, timeScale: TimeScale, revision: number): HistoryState {
  const api = useApi()
  const [state, setState] = useState<HistoryState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    api
      .getHistory(deviceId, timeScale)
      .then((resp) => {
        if (!cancelled) setState({ kind: 'ready', timeScale, readings: resp.history ?? [] })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ kind: 'error', message: errorMessage(err) })
      })
    return () => {
      cancelled = true
    }
  }, [api, deviceId, timeScale, revision])

  return state
}
