import { describe, it, expect } from 'vitest'
import { db } from './db'

describe('despensapp database (Dexie v1)', () => {
  it('defines exactly the 5 tables of the design schema', () => {
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      'carts',
      'lists',
      'movements',
      'products',
      'suppliers',
    ])
  })

  it('opens under fake-indexeddb', async () => {
    await db.open()
    expect(db.isOpen()).toBe(true)
  })
})
