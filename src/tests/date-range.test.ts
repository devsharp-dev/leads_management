import { describe, expect, it } from 'vitest'
import {
  buildCustomRange,
  buildPresetRange,
  previousPeriod,
} from '../lib/dates/date-range'
import { compareValues, safeRate } from '../lib/format/number'

describe('date-range utilities', () => {
  const now = new Date('2026-10-18T12:00:00.000Z')

  it('builds today as a single calendar day', () => {
    const range = buildPresetRange('today', now)
    expect(range.start.getDate()).toBe(18)
    expect(range.end.getDate()).toBe(18)
    expect(previousPeriod(range).start.getDate()).toBe(17)
  })

  it('builds last 7 and last 30 with correct length', () => {
    const last7 = buildPresetRange('last_7', now)
    const last30 = buildPresetRange('last_30', now)
    const prev7 = previousPeriod(last7)
    const prev30 = previousPeriod(last30)
    expect(prev7.end < last7.start).toBe(true)
    expect(prev30.end < last30.start).toBe(true)
  })

  it('rejects invalid custom ranges', () => {
    expect(() => buildCustomRange('2026-10-10', '2026-10-01')).toThrow()
  })

  it('accepts inclusive custom ranges', () => {
    const range = buildCustomRange('2026-10-01', '2026-10-31')
    expect(range.preset).toBe('custom')
    expect(range.start.getDate()).toBe(1)
  })
})

describe('comparison helpers', () => {
  it('returns New when previous is zero and current is positive', () => {
    expect(compareValues(5, 0).label).toBe('New')
  })

  it('returns --- when both are zero', () => {
    expect(compareValues(0, 0).label).toBe('---')
  })

  it('computes percentage change', () => {
    expect(compareValues(150, 100).percent).toBe(50)
  })

  it('safeRate handles zero denominator', () => {
    expect(safeRate(5, 0)).toBe(0)
  })
})
