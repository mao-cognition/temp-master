// UI 確認用のモック API。`npm run dev:mock` で有効になり、本番ビルドには含まれない。
// URL の ?scenario= で状態を切り替えられる:
//   (なし)        通常データ
//   unconfigured  /api/status が configured:false、メーター0件（SwitchBot 鍵なしのローカル環境と同等）
//   rate-limited  レート制限中
//   error         API への接続失敗
import type { ApiClient } from './client'
import { ApiError } from './client'
import type { Meter, Reading, StatusResponse, TimeScale } from '../types'

const HOUR = 3600_000
const DAY = 24 * HOUR

const RANGE_MS: Record<TimeScale, number> = {
  hour: HOUR,
  day: DAY,
  week: 7 * DAY,
  month: 30 * DAY,
  year: 365 * DAY,
}

const POINTS: Record<TimeScale, number> = { hour: 30, day: 48, week: 56, month: 60, year: 52 }

interface MockMeterSeed {
  meter: Omit<Meter, 'last_updated'>
  ageMs: number | null
  base: number
}

const SEEDS: MockMeterSeed[] = [
  { meter: m('C76B0046301A', 'Bedroom Meter', 'MeterPlus', 27.7, 60, 82), ageMs: 2 * 60_000, base: 27 },
  { meter: m('D12D0346415D', 'Living Meter', 'MeterPlus', 24.3, 55, 64), ageMs: 3 * 60_000, base: 24 },
  { meter: m('F577B677EC97', '2世', 'Meter', 31.2, 48, 100), ageMs: 4 * 60_000, base: 31 },
  { meter: m('E1A2B3C4D5E6', '夢男', 'Meter', 26.7, 72, 18), ageMs: 5 * 60_000, base: 26 },
  { meter: m('B0E9FE83F0D4', 'アワコ', 'Hub 2', 22.4, 66, null), ageMs: 60_000, base: 22 },
  { meter: m('A1B2C3D4E5F6', '外', 'WoIOSensor', 18.9, 81, 92), ageMs: 6 * 60_000, base: 18 },
  { meter: m('F577B677EC96', 'ネズミ', 'Meter', 24.1, 85, 100), ageMs: 10 * DAY, base: 24 },
  { meter: m('0A1B2C3D4E5F', 'ゴンタ', 'Meter', null, null, null), ageMs: null, base: 0 },
]

function m(
  device_id: string,
  device_name: string,
  device_type: string,
  current_temperature: number | null,
  current_humidity: number | null,
  battery: number | null,
): Omit<Meter, 'last_updated'> {
  return { device_id, device_name, device_type, hub_device_id: null, current_temperature, current_humidity, battery }
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function buildMeters(now: number): Meter[] {
  return SEEDS.map(({ meter, ageMs }) => ({
    ...meter,
    last_updated: ageMs === null ? null : new Date(now - ageMs).toISOString(),
  }))
}

function buildHistory(seed: MockMeterSeed, timeScale: TimeScale, now: number): Reading[] {
  const count = POINTS[timeScale]
  const step = RANGE_MS[timeScale] / count
  const phase = (hash(seed.meter.device_id) % 628) / 100
  const readings: Reading[] = []
  for (let i = 0; i < count; i++) {
    const t = now - (count - 1 - i) * step
    const daily = Math.sin((t / DAY) * 2 * Math.PI + phase) * 1.8
    const noise = Math.sin(i * 1.7 + phase) * 0.35
    readings.push({
      timestamp: new Date(t).toISOString(),
      temperature: Math.round((seed.base + daily + noise) * 10) / 10,
      humidity: 55 + Math.round(Math.sin(i / 5 + phase) * 10),
      battery: seed.meter.battery,
    })
  }
  return readings
}

export function createMockClient(scenario: string | null): ApiClient {
  const unconfigured = scenario === 'unconfigured'
  const failing = scenario === 'error'

  const fail = () => Promise.reject(new ApiError(503, 'Mock: backend unreachable'))

  return {
    getMeters: () => {
      if (failing) return fail()
      const meters = unconfigured ? [] : buildMeters(Date.now())
      const latest = meters.map((x) => x.last_updated).filter((x): x is string => !!x).sort().at(-1) ?? null
      return delay({ meters, last_updated: latest })
    },
    getStatus: () => {
      if (failing) return fail()
      const rateLimited = scenario === 'rate-limited'
      const status: StatusResponse = {
        configured: !unconfigured,
        meters_count: unconfigured ? 0 : SEEDS.length,
        is_rate_limited: rateLimited,
        backoff_remaining: rateLimited ? 120 : 0,
        last_api_call: unconfigured ? 0 : Date.now() / 1000,
        collection_interval: 3600,
      }
      return delay(status)
    },
    getHistory: (deviceId, timeScale) => {
      if (failing) return fail()
      const seed = SEEDS.find((s) => s.meter.device_id === deviceId)
      if (!seed || unconfigured) return Promise.reject(new ApiError(404, 'Device not found'))
      const now = Date.now()
      return delay({
        device_id: deviceId,
        time_scale: timeScale,
        history: buildHistory(seed, timeScale, now),
        device: buildMeters(now).find((x) => x.device_id === deviceId) ?? null,
      })
    },
    refresh: () => {
      if (failing) return fail()
      if (unconfigured) {
        return delay(null, 600).then(() => {
          throw new ApiError(500, 'SwitchBot credentials not configured')
        })
      }
      return delay({ status: 'ok', message: 'Data collection triggered', meters_count: SEEDS.length }, 800)
    },
    backupUrl: () => null,
  }
}
