import { TIME_SCALE_OPTIONS } from '../lib/timeScale'
import type { TimeScale } from '../types'


interface Props {
  timeScale: TimeScale
  onTimeScaleChange: (t: TimeScale) => void
  refreshing: boolean
  onRefresh: () => void
  backupUrl: string | null
}

export function Controls({ timeScale, onTimeScaleChange, refreshing, onRefresh, backupUrl }: Props) {
  return (
    <section className="card controls" aria-label="表示設定">
      <div className="controls__field">
        <label htmlFor="time-scale-select">Time Range:</label>
        <select
          id="time-scale-select"
          className="select"
          value={timeScale}
          onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
        >
          {TIME_SCALE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="controls__actions">
        <button type="button" id="btn-refresh" className="btn btn--primary" disabled={refreshing} onClick={onRefresh}>
          {refreshing && <span className="spinner" aria-hidden="true" />}
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          type="button"
          id="btn-backup"
          className="btn btn--secondary"
          disabled={!backupUrl}
          title={backupUrl ? undefined : 'モックモードでは無効です'}
          onClick={() => backupUrl && window.open(backupUrl, '_blank')}
        >
          Download Backup
        </button>
      </div>
    </section>
  )
}
