import { getDisplayName } from '../lib/displayNames'
import { isPresent } from '../lib/format'
import type { Meter, TimeScale } from '../types'
import { TemperatureChart } from './TemperatureChart'

interface Props {
  meter: Meter
  stale: boolean
  timeScale: TimeScale
  revision: number
}

export function MeterCard({ meter, stale, timeScale, revision }: Props) {
  return (
    <article className={`card meter-card${stale ? ' meter-card--stale' : ''}`} data-device-id={meter.device_id}>
      <header className="meter-card__header">
        <div className="meter-card__title">
          <strong>{getDisplayName(meter.device_name)}</strong>
          {stale && <span className="badge badge--warning">7日以上未更新</span>}
        </div>
        <span className="tag">{meter.device_type}</span>
      </header>
      <div className="meter-card__body">
        <div className="meter-stats">
          {isPresent(meter.current_temperature) && (
            <span className="stat stat--temp" title="温度">
              <span className="stat__label">温度</span>
              {meter.current_temperature}°C
            </span>
          )}
          {isPresent(meter.current_humidity) && (
            <span className="stat stat--humidity" title="湿度">
              <span className="stat__label">湿度</span>
              {meter.current_humidity}%
            </span>
          )}
          {isPresent(meter.battery) && (
            <span className={`stat stat--battery${meter.battery <= 20 ? ' stat--low' : ''}`} title="バッテリー">
              <span className="stat__label">電池</span>
              {meter.battery}%
            </span>
          )}
        </div>
        {stale ? (
          <p className="meter-card__note">履歴データの取得対象外</p>
        ) : (
          <TemperatureChart deviceId={meter.device_id} timeScale={timeScale} revision={revision} />
        )}
        {meter.last_updated ? (
          <p className="meter-card__updated">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
        ) : (
          stale && <p className="meter-card__note">値がありません（データ未受信）</p>
        )}
      </div>
    </article>
  )
}
