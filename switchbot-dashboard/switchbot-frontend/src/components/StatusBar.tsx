import { formatClock } from '../lib/format'
import type { StatusResponse } from '../types'
import { Alert } from './Alerts'

export function StatusBar({ status, lastRefresh }: { status: StatusResponse | null; lastRefresh: Date | null }) {
  if (!status) return null
  const count = status.meters_count || 0
  return (
    <>
      <Alert variant="info" id="status-bar">
        <div className="status-bar">
          <span id="status-meters-count">
            Monitoring {count} {count === 1 ? 'meter' : 'meters'}
          </span>
          {lastRefresh && <span id="status-last-refresh">Last refresh: {formatClock(lastRefresh)}</span>}
        </div>
      </Alert>
      {status.is_rate_limited && (
        <Alert variant="warning" id="rate-limit-warning">
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {status.backoff_remaining || 0}{' '}
          seconds.
        </Alert>
      )}
      {!status.configured && (
        <Alert variant="warning" id="not-configured-warning">
          <strong>SwitchBot API 未設定.</strong> バックエンドに SWITCHBOT_TOKEN / SWITCHBOT_SECRET
          が設定されていないため、新しいデータは収集されません（保存済みのデータのみ表示します）。
        </Alert>
      )}
    </>
  )
}
