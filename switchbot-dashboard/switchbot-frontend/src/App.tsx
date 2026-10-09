import { useState } from 'react'
import { useApi } from './api/ApiContext'
import { errorMessage } from './api/client'
import { Alert } from './components/Alerts'
import { Controls } from './components/Controls'
import { Footer } from './components/Footer'
import { MeterList } from './components/MeterList'
import { Navbar } from './components/Navbar'
import { StatusBar } from './components/StatusBar'
import { useDashboardData } from './hooks'
import type { TimeScale } from './types'

export default function App() {
  const api = useApi()
  const { meters, status, loading, error, connected, lastRefresh, revision, reload } = useDashboardData()
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      await api.refresh()
    } catch (err) {
      setRefreshError(`Failed to refresh: ${errorMessage(err)}`)
    }
    await reload()
    setRefreshing(false)
  }

  const showEmpty = !loading && !error && meters.length === 0

  return (
    <>
      <Navbar connected={connected} />
      <main className="container">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
          backupUrl={api.backupUrl()}
        />
        <StatusBar status={status} lastRefresh={lastRefresh} />
        {refreshError && (
          <Alert variant="danger" id="refresh-error" onDismiss={() => setRefreshError(null)}>
            <strong>Error.</strong> {refreshError}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" id="error">
            <strong>Error.</strong> {error}
          </Alert>
        )}
        {loading && (
          <div id="loading" className="loading">
            <span className="spinner spinner--lg" aria-hidden="true" />
            Loading temperature data...
          </div>
        )}
        {showEmpty && (
          <div className="card empty-state" id="empty-state">
            <p className="empty-state__title">表示できるメーターがありません</p>
            <p className="empty-state__text">
              {status && !status.configured
                ? 'SwitchBot API の認証情報を設定すると、メーターのデータが表示されます。'
                : 'データ収集の完了をお待ちください。'}
            </p>
          </div>
        )}
        <MeterList
          meters={meters}
          timeScale={timeScale}
          revision={revision}
          referenceTime={lastRefresh?.getTime() ?? 0}
        />
        <Footer />
      </main>
    </>
  )
}
