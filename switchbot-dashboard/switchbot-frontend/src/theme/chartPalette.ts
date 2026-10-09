import type { ResolvedTheme } from './ThemeContext'

export interface ChartPalette {
  line: string
  fill: string
  pointHover: string
  grid: string
  tick: string
  tooltipBg: string
  tooltipText: string
}

export const CHART_PALETTES: Record<ResolvedTheme, ChartPalette> = {
  light: {
    line: '#dc2626',
    fill: 'rgba(220, 38, 38, 0.12)',
    pointHover: '#0284c7',
    grid: 'rgba(15, 23, 42, 0.06)',
    tick: '#64748b',
    tooltipBg: 'rgba(15, 23, 42, 0.9)',
    tooltipText: '#f8fafc',
  },
  dark: {
    line: '#f87171',
    fill: 'rgba(248, 113, 113, 0.18)',
    pointHover: '#38bdf8',
    grid: 'rgba(148, 163, 184, 0.14)',
    tick: '#94a3b8',
    tooltipBg: 'rgba(241, 245, 249, 0.95)',
    tooltipText: '#0f172a',
  },
}
