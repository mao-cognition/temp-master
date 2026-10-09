import { STALE_METER_THRESHOLD_MS } from '../config'
import type { Meter, TimeScale } from '../types'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp)
  const hm = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
  switch (timeScale) {
    case 'hour':
    case 'day':
      return hm
    case 'week':
      return `${DAY_SHORT[date.getDay()]} ${pad2(date.getHours())}`
    case 'month':
    case 'year':
      return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`
    default:
      return date.toLocaleString()
  }
}

export function formatClock(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

// last_updated が無い・不正・7日以上前のメーターは「未更新」として扱う
export function isStaleMeter(meter: Meter, now: number = Date.now()): boolean {
  if (!meter.last_updated) return true
  const t = new Date(meter.last_updated).getTime()
  if (Number.isNaN(t)) return true
  return now - t >= STALE_METER_THRESHOLD_MS
}

export function isPresent<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined
}
