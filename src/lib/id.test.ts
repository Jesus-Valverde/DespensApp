import { describe, it, expect } from 'vitest'
import { nextId } from './id'

describe('nextId', () => {
  it('returns 1 for an empty list', () => {
    expect(nextId([])).toBe(1)
  })

  it('returns one above the maximum existing id', () => {
    expect(nextId([{ id: 1 }, { id: 3 }])).toBe(4)
  })

  it('finds the maximum even when items are unsorted', () => {
    expect(nextId([{ id: 5 }, { id: 2 }])).toBe(6)
  })
})
