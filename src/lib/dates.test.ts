import { describe, it, expect, afterEach, vi } from 'vitest'
import { today, addPeriod, isDue, formatDate } from './dates'

afterEach(() => {
  vi.useRealTimers()
})

describe('today', () => {
  it('returns the local date as YYYY-MM-DD', () => {
    vi.setSystemTime(new Date(2026, 8, 6, 10, 30))
    expect(today()).toBe('2026-09-06')
  })

  it('keeps the local date late in the evening (not UTC-based)', () => {
    vi.setSystemTime(new Date(2026, 8, 6, 23, 30))
    expect(today()).toBe('2026-09-06')
  })
})

describe('addPeriod', () => {
  it('semanal adds seven days (2026-09-01 → 2026-09-08)', () => {
    expect(addPeriod('2026-09-01', 'semanal')).toBe('2026-09-08')
  })

  it('semanal crosses the month boundary (2026-09-28 → 2026-10-05)', () => {
    expect(addPeriod('2026-09-28', 'semanal')).toBe('2026-10-05')
  })

  it('quincenal lands two weeks later (2026-09-06 → 2026-09-20, spec recompute scenario)', () => {
    expect(addPeriod('2026-09-06', 'quincenal')).toBe('2026-09-20')
  })

  it('mensual keeps the day on a normal month (2026-09-06 → 2026-10-06)', () => {
    expect(addPeriod('2026-09-06', 'mensual')).toBe('2026-10-06')
  })

  it('mensual clamps the day to the end of the month (2026-01-31 → 2026-02-28)', () => {
    expect(addPeriod('2026-01-31', 'mensual')).toBe('2026-02-28')
  })

  it('mensual clamps into a leap-year February (2028-01-31 → 2028-02-29)', () => {
    expect(addPeriod('2028-01-31', 'mensual')).toBe('2028-02-29')
  })

  it('mensual rolls over the year (2026-12-15 → 2027-01-15)', () => {
    expect(addPeriod('2026-12-15', 'mensual')).toBe('2027-01-15')
  })
})

describe('isDue', () => {
  it('is true for a past date and for today, false for a future date', () => {
    vi.setSystemTime(new Date(2026, 8, 6, 12, 0))
    expect(isDue('2026-09-05')).toBe(true)
    expect(isDue('2026-08-31')).toBe(true)
    expect(isDue('2026-09-06')).toBe(true)
    expect(isDue('2026-09-07')).toBe(false)
  })
})

describe('formatDate', () => {
  it('formats a date in long Spanish', () => {
    expect(formatDate('2026-09-20')).toBe('20 de septiembre de 2026')
    expect(formatDate('2026-01-31')).toBe('31 de enero de 2026')
  })
})
