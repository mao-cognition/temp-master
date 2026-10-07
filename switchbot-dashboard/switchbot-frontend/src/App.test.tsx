import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiContext } from './api/ApiContext'
import type { ApiClient } from './api/client'
import { ApiError } from './api/client'
import App from './App'
import { ThemeProvider } from './theme/ThemeProvider'
import type { Meter } from './types'

// jsdom には canvas が無いため、チャートは差し替える
vi.mock('./components/TemperatureChart', () => ({
  TemperatureChart: ({ timeScale }: { timeScale: string }) => <div data-testid="chart">{timeScale}</div>,
}))

const fresh: Meter = {
  device_id: 'A',
  device_name: 'Bedroom Meter',
  device_type: 'MeterPlus',
  current_temperature: 27.7,
  current_humidity: 60,
  battery: 82,
  last_updated: new Date().toISOString(),
}

const stale: Meter = {
  ...fresh,
  device_id: 'B',
  device_name: 'ゴンタ',
  current_temperature: null,
  current_humidity: null,
  battery: null,
  last_updated: null,
}

function client(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    getMeters: async () => ({ meters: [fresh, stale], last_updated: fresh.last_updated }),
    getStatus: async () => ({
      configured: true,
      meters_count: 2,
      is_rate_limited: false,
      backoff_remaining: 0,
      last_api_call: 0,
      collection_interval: 3600,
    }),
    getHistory: async () => ({ device_id: 'A', time_scale: 'day', history: [], device: null }),
    refresh: async () => ({ status: 'ok', message: '', meters_count: 2 }),
    backupUrl: () => '/api/backup',
    ...overrides,
  }
}

function renderApp(api: ApiClient) {
  return render(
    <ApiContext.Provider value={api}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ApiContext.Provider>,
  )
}

describe('App', () => {
  it('メーター一覧・値・Connected バッジを表示し、未更新メーターを別枠に出す', async () => {
    renderApp(client())
    expect(await screen.findByText('第1蒸留塔 (T-101)')).toBeInTheDocument()
    expect(screen.getByText('27.7°C')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('82%')).toBeInTheDocument()
    expect(document.getElementById('connection-status')).toHaveTextContent('Connected')
    expect(screen.getByText('未更新のメーター')).toBeInTheDocument()
    expect(screen.getByText('混合槽 (M-801)')).toBeInTheDocument()
    expect(screen.getByText('Monitoring 2 meters')).toBeInTheDocument()
    expect(screen.getByText(/Built with React 19 \+ Vite \+ TypeScript/)).toBeInTheDocument()
  })

  it('時間範囲を変えるとチャートに反映される', async () => {
    renderApp(client())
    expect(await screen.findByTestId('chart')).toHaveTextContent('day')
    await userEvent.selectOptions(screen.getByLabelText('Time Range:'), 'week')
    expect(screen.getByTestId('chart')).toHaveTextContent('week')
  })

  it('configured:false でメーター0件でも壊れず案内を表示し、更新失敗はエラー表示する', async () => {
    const api = client({
      getMeters: async () => ({ meters: [], last_updated: null }),
      getStatus: async () => ({
        configured: false,
        meters_count: 0,
        is_rate_limited: false,
        backoff_remaining: 0,
        last_api_call: 0,
        collection_interval: 3600,
      }),
      refresh: async () => {
        throw new ApiError(500, 'SwitchBot credentials not configured')
      },
    })
    renderApp(api)
    expect(await screen.findByText('表示できるメーターがありません')).toBeInTheDocument()
    expect(screen.getByText(/SwitchBot API 未設定/)).toBeInTheDocument()
    expect(document.getElementById('connection-status')).toHaveTextContent('Connected')

    await userEvent.click(screen.getByRole('button', { name: 'Refresh Data' }))
    expect(await screen.findByText(/Failed to refresh: SwitchBot credentials not configured/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh Data' })).toBeEnabled())
  })

  it('API に接続できないと Disconnected になる', async () => {
    renderApp(client({ getMeters: async () => Promise.reject(new Error('Network error')) }))
    expect(await screen.findByText(/Failed to fetch data: Network error/)).toBeInTheDocument()
    expect(document.getElementById('connection-status')).toHaveTextContent('Disconnected')
  })

  it('テーマを切り替えると data-theme と localStorage が更新される', async () => {
    renderApp(client())
    await userEvent.click(screen.getByRole('button', { name: /ダーク/ }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('temp-master-theme')).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: /ライト/ }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(screen.getByRole('button', { name: /ライト/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
