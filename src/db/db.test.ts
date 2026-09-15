import { describe, it, expect } from 'vitest'
import { db, parseContentSize } from './db'

describe('despensapp database (Dexie v2)', () => {
  it('defines exactly the 6 tables of the design schema', () => {
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      'carts',
      'lists',
      'movements',
      'productDefs',
      'products',
      'suppliers',
    ])
  })

  it('opens under fake-indexeddb', async () => {
    await db.open()
    expect(db.isOpen()).toBe(true)
  })
})

describe('parseContentSize (v1 → v2 migration helper)', () => {
  it('splits known "value unit" pairs into canonical symbols', () => {
    expect(parseContentSize('500 ml')).toEqual({ content: '500', unit: 'ml' })
    expect(parseContentSize('1 L')).toEqual({ content: '1', unit: 'L' })
    expect(parseContentSize('1 l')).toEqual({ content: '1', unit: 'L' })
    expect(parseContentSize('3 PZA')).toEqual({ content: '3', unit: 'pza' })
  })

  it('keeps unparseable values as raw content without unit', () => {
    expect(parseContentSize('Pieza 12')).toEqual({ content: 'Pieza 12' })
    expect(parseContentSize('500 parsecs')).toEqual({ content: '500 parsecs' })
    expect(parseContentSize(undefined)).toEqual({})
    expect(parseContentSize('   ')).toEqual({})
  })
})
