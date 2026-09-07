// Date helpers (design decision 4): 'YYYY-MM-DD' strings with local semantics —
// lexicographically comparable, no date library. Monthly period arithmetic
// clamps day overflow to the end of the target month.

import type { Period } from '../db/types'

export type RecurringPeriod = Exclude<Period, null>

// quincenal = one quincena ahead: the 1st → the 15th is 14 days (the spec's
// recompute scenario pins 2026-09-06 + quincenal → 2026-09-20).
const DAYS_PER_PERIOD: Record<'semanal' | 'quincenal', number> = {
  semanal: 7,
  quincenal: 14,
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

function parseISO(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

/** Today's date in the machine's local zone as 'YYYY-MM-DD'. */
export function today(): string {
  const now = new Date()
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/** Adds a purchase period to a 'YYYY-MM-DD' date. Monthly periods clamp the
 * day to the end of the target month (2026-01-31 + mensual → 2026-02-28). */
export function addPeriod(date: string, period: RecurringPeriod): string {
  const { year, month, day } = parseISO(date)
  if (period === 'mensual') {
    // `month` is 1-based, so new Date(year, month, 1) is the 1st of the NEXT month.
    const nextMonth = new Date(year, month, 1)
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
    return toISO(nextMonth.getFullYear(), nextMonth.getMonth() + 1, Math.min(day, lastDay))
  }
  const shifted = new Date(year, month - 1, day + DAYS_PER_PERIOD[period])
  return toISO(shifted.getFullYear(), shifted.getMonth() + 1, shifted.getDate())
}

/** A scheduled date is due when it is today or already past. 'YYYY-MM-DD'
 * strings compare lexicographically, so no Date parsing is needed. */
export function isDue(next: string): boolean {
  return next <= today()
}

const longDateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })

/** Formats a 'YYYY-MM-DD' date in long Spanish, e.g. "20 de septiembre de 2026". */
export function formatDate(date: string): string {
  const { year, month, day } = parseISO(date)
  return longDateFormatter.format(new Date(year, month - 1, day))
}
