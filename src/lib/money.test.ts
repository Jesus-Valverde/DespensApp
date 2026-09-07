import { describe, it, expect } from 'vitest'
import { parseMoney, formatMoney } from './money'

describe('parseMoney', () => {
  it('parses a peso amount into integer centavos ("25.50" → 2550)', () => {
    expect(parseMoney('25.50')).toBe(2550)
  })

  it('accepts whole pesos, cents-only and one-decimal amounts', () => {
    expect(parseMoney('25')).toBe(2500)
    expect(parseMoney('0.99')).toBe(99)
    expect(parseMoney('.5')).toBe(50)
    expect(parseMoney('0')).toBe(0)
  })

  it('parses negatives so the api layer can reject them with its message', () => {
    expect(parseMoney('-1')).toBe(-100)
    expect(parseMoney('-25.50')).toBe(-2550)
  })

  it('returns null for anything that is not a valid amount', () => {
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('   ')).toBeNull()
    expect(parseMoney('abc')).toBeNull()
    expect(parseMoney('25.505')).toBeNull()
    expect(parseMoney('1,000')).toBeNull()
    expect(parseMoney('25.')).toBeNull()
  })
})

describe('formatMoney', () => {
  it('formats centavos as MXN currency', () => {
    expect(formatMoney(2550)).toBe('$25.50')
  })

  it('formats small and zero amounts with two decimals', () => {
    expect(formatMoney(5)).toBe('$0.05')
    expect(formatMoney(0)).toBe('$0.00')
  })
})
