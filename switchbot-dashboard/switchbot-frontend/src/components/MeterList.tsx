import { isStaleMeter } from '../lib/format'
import type { Meter, TimeScale } from '../types'
import { MeterCard } from './MeterCard'

interface Props {
  meters: Meter[]
  timeScale: TimeScale
  revision: number
  // 未更新判定の基準時刻（最後にデータを取得した時刻）
  referenceTime: number
}

export function MeterList({ meters, timeScale, revision, referenceTime }: Props) {
  const active = meters.filter((m) => !isStaleMeter(m, referenceTime))
  const stale = meters.filter((m) => isStaleMeter(m, referenceTime))

  return (
    <div id="meters-container">
      {active.length > 0 && (
        <div className="meter-grid">
          {active.map((m) => (
            <MeterCard key={m.device_id} meter={m} stale={false} timeScale={timeScale} revision={revision} />
          ))}
        </div>
      )}
      {stale.length > 0 && (
        <section className="stale-section" aria-labelledby="stale-title">
          <h2 id="stale-title" className="stale-section__title">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            未更新のメーター
          </h2>
          <p className="stale-section__subtitle">1週間以上更新されていないデバイス</p>
          <div className="stale-section__panel">
            <div className="meter-grid">
              {stale.map((m) => (
                <MeterCard key={m.device_id} meter={m} stale timeScale={timeScale} revision={revision} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
