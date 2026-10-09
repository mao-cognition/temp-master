import { describe, expect, it } from 'vitest'
import { getDisplayName } from './displayNames'
import { formatTimestamp, isStaleMeter } from './format'
import type { Meter } from '../types'

const base: Meter = {
  device_id: 'X',
  device_name: 'Bedroom Meter',
  device_type: 'Meter',
  current_temperature: 25,
  current_humidity: 50,
  battery: 90,
  last_updated: null,
}

describe('formatTimestamp', () => {
  const ts = new Date(2026, 9, 7, 9, 5).toISOString()
  it.each([
    ['hour', '09:05'],
    ['day', '09:05'],
    ['week', 'Wed 09'],
    ['month', 'Oct 7'],
    ['year', 'Oct 7'],
  ] as const)('%s → %s', (scale, expected) => {
    expect(formatTimestamp(ts, scale)).toBe(expected)
  })
})

describe('isStaleMeter', () => {
  const now = Date.UTC(2026, 9, 7)
  it('last_updated が無ければ未更新扱い', () => {
    expect(isStaleMeter(base, now)).toBe(true)
  })
  it('不正な日付は未更新扱い', () => {
    expect(isStaleMeter({ ...base, last_updated: 'invalid' }, now)).toBe(true)
  })
  it('7日以上前は未更新扱い', () => {
    expect(isStaleMeter({ ...base, last_updated: new Date(now - 7 * 86400_000).toISOString() }, now)).toBe(true)
  })
  it('7日未満は最新扱い', () => {
    expect(isStaleMeter({ ...base, last_updated: new Date(now - 6 * 86400_000).toISOString() }, now)).toBe(false)
  })
})

describe('getDisplayName', () => {
  it('マッピングがあれば設備名を返す', () => {
    expect(getDisplayName('Bedroom Meter')).toBe('第1蒸留塔 (T-101)')
  })
  it('マッピングが無ければ元の名前を返す', () => {
    expect(getDisplayName('Unknown Hub')).toBe('Unknown Hub')
  })
})
