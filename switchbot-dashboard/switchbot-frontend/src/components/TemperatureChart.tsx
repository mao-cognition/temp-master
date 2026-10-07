import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { useMeterHistory } from '../hooks'
import { formatTimestamp } from '../lib/format'
import { CHART_PALETTES } from '../theme/chartPalette'
import { useTheme } from '../theme/ThemeContext'
import type { TimeScale } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface Props {
  deviceId: string
  timeScale: TimeScale
  revision: number
}

export function TemperatureChart({ deviceId, timeScale, revision }: Props) {
  const history = useMeterHistory(deviceId, timeScale, revision)
  const { resolved } = useTheme()
  const palette = CHART_PALETTES[resolved]

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: palette.tooltipBg,
          titleColor: palette.tooltipText,
          bodyColor: palette.tooltipText,
          callbacks: {
            label: (item) => (typeof item.parsed.y === 'number' ? `${item.parsed.y.toFixed(1)}°C` : ''),
          },
        },
      },
      scales: {
        x: {
          grid: { color: palette.grid },
          ticks: { maxTicksLimit: 8, font: { size: 10 }, color: palette.tick },
        },
        y: {
          grid: { color: palette.grid },
          ticks: { font: { size: 10 }, color: palette.tick, callback: (v) => `${v}°` },
        },
      },
    }),
    [palette],
  )

  if (history.kind === 'loading') {
    return <div className="chart chart--placeholder">Loading chart...</div>
  }
  if (history.kind === 'error') {
    return <div className="chart chart--placeholder">履歴データを取得できませんでした</div>
  }
  if (history.readings.length === 0) {
    return <div className="chart chart--placeholder">この期間の履歴データはありません</div>
  }

  const data = {
    labels: history.readings.map((r) => formatTimestamp(r.timestamp, history.timeScale)),
    datasets: [
      {
        label: 'Temperature (C)',
        data: history.readings.map((r) => r.temperature),
        borderColor: palette.line,
        backgroundColor: palette.fill,
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: palette.line,
        pointBorderColor: palette.line,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: palette.pointHover,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  return (
    <div className="chart" data-testid={`chart-${deviceId}`}>
      <Line data={data} options={options} aria-label="温度の推移" role="img" />
    </div>
  )
}
