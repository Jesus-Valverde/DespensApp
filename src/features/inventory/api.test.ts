import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '../../db/db'
import { createProduct, getProduct, updateProduct } from '../products/api'
import { setStock, registerMovement, getMovements } from './api'
import * as inventoryApi from './api'

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.movements.clear()])
})

describe('setStock', () => {
  it('stores current, min, max and the free-text location on the product', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })

    await setStock(id, { current: 6, min: 2, max: 12, location: 'refri' })

    expect((await getProduct(id))?.stock).toEqual({ current: 6, min: 2, max: 12, location: 'refri' })
  })

  it('rejects negative current, min or max with a Spanish error and keeps the stock', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })

    await expect(setStock(id, { current: -1, min: null, max: null })).rejects.toThrow('negativas')
    await expect(setStock(id, { current: 0, min: -1, max: null })).rejects.toThrow('negativas')
    await expect(setStock(id, { current: 0, min: null, max: -1 })).rejects.toThrow('negativas')

    expect((await getProduct(id))?.stock).toEqual({ current: 0, min: null, max: null })
  })

  it('rejects min greater than max with a Spanish error', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })

    await expect(setStock(id, { current: 6, min: 8, max: 5 })).rejects.toThrow('mínimo')

    expect((await getProduct(id))?.stock).toEqual({ current: 0, min: null, max: null })
  })

  it('allows null min/max and drops a blank location', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 6, min: 2, max: 12, location: 'refri' })

    await setStock(id, { current: 5, min: null, max: null, location: '   ' })

    expect((await getProduct(id))?.stock).toEqual({ current: 5, min: null, max: null })
  })

  it('rejects setting stock on a product that does not exist', async () => {
    await expect(setStock(9999, { current: 1, min: null, max: null })).rejects.toThrow('encontrado')
  })
})

describe('registerMovement', () => {
  it('entrada increases stock and records the movement with the resulting stock', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, { stock: { current: 4, min: null, max: null } })

    await registerMovement(id, { type: 'entrada', qty: 6 })

    expect((await getProduct(id))?.stock.current).toBe(10)
    const movements = await db.movements.where('productId').equals(id).toArray()
    expect(movements).toHaveLength(1)
    expect(movements[0]).toMatchObject({
      productId: id,
      type: 'entrada',
      qty: 6,
      delta: 6,
      resultingQty: 10,
    })
    expect(movements[0].date).toEqual(expect.any(String))
  })

  it('salida decreases stock and records a negative delta', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, { stock: { current: 10, min: null, max: null } })

    await registerMovement(id, { type: 'salida', qty: 3 })

    expect((await getProduct(id))?.stock.current).toBe(7)
    const [movement] = await db.movements.where('productId').equals(id).toArray()
    expect(movement).toMatchObject({ type: 'salida', qty: 3, delta: -3, resultingQty: 7 })
  })

  it('salida exceeding the current stock is rejected and nothing changes', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, { stock: { current: 2, min: null, max: null } })

    await expect(registerMovement(id, { type: 'salida', qty: 5 })).rejects.toThrow('stock')

    expect((await getProduct(id))?.stock.current).toBe(2)
    expect(await db.movements.where('productId').equals(id).count()).toBe(0)
  })

  it('salida of exactly the current stock is allowed and leaves zero', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, { stock: { current: 3, min: null, max: null } })

    await registerMovement(id, { type: 'salida', qty: 3 })

    expect((await getProduct(id))?.stock.current).toBe(0)
    const [movement] = await db.movements.where('productId').equals(id).toArray()
    expect(movement).toMatchObject({ delta: -3, resultingQty: 0 })
  })

  it('ajuste sets the absolute quantity and records the delta', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, { stock: { current: 2, min: null, max: null } })

    await registerMovement(id, { type: 'ajuste', qty: 9, note: 'reconteo' })

    expect((await getProduct(id))?.stock.current).toBe(9)
    const [movement] = await db.movements.where('productId').equals(id).toArray()
    expect(movement).toMatchObject({ type: 'ajuste', qty: 9, delta: 7, resultingQty: 9 })
    expect(movement.note).toBe('reconteo')
  })

  it('ajuste downward records a negative delta', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, { stock: { current: 9, min: null, max: null } })

    await registerMovement(id, { type: 'ajuste', qty: 4 })

    expect((await getProduct(id))?.stock.current).toBe(4)
    const [movement] = await db.movements.where('productId').equals(id).toArray()
    expect(movement).toMatchObject({ qty: 4, delta: -5, resultingQty: 4 })
  })

  it('rejects a non-positive entrada/salida quantity and a negative ajuste target', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, { stock: { current: 5, min: null, max: null } })

    await expect(registerMovement(id, { type: 'entrada', qty: 0 })).rejects.toThrow('cantidad')
    await expect(registerMovement(id, { type: 'salida', qty: -2 })).rejects.toThrow('cantidad')
    await expect(registerMovement(id, { type: 'ajuste', qty: -1 })).rejects.toThrow('negativa')

    expect((await getProduct(id))?.stock.current).toBe(5)
    expect(await db.movements.count()).toBe(0)
  })

  it('keeps stock and movement consistent in one transaction (no partial write)', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, { stock: { current: 4, min: null, max: null } })
    const updateSpy = vi.spyOn(db.products, 'update').mockRejectedValueOnce(new Error('boom'))

    await expect(registerMovement(id, { type: 'entrada', qty: 6 })).rejects.toThrow('boom')

    updateSpy.mockRestore()
    expect((await getProduct(id))?.stock.current).toBe(4)
    expect(await db.movements.where('productId').equals(id).count()).toBe(0)
  })

  it('rejects registering a movement on a product that does not exist', async () => {
    await expect(registerMovement(9999, { type: 'entrada', qty: 1 })).rejects.toThrow('encontrado')
  })
})

describe('getMovements (bitácora)', () => {
  it('returns the product movements in reverse chronological order, other products excluded', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    const otherId = await createProduct({ title: 'Jabón', customProps: [] })
    await db.movements.bulkAdd([
      { productId: id, date: '2026-09-01T10:00:00.000Z', type: 'entrada', qty: 4, delta: 4, resultingQty: 4 },
      { productId: id, date: '2026-09-03T09:00:00.000Z', type: 'salida', qty: 1, delta: -1, resultingQty: 3 },
      { productId: id, date: '2026-09-02T12:00:00.000Z', type: 'ajuste', qty: 6, delta: 2, resultingQty: 6 },
      { productId: otherId, date: '2026-09-04T08:00:00.000Z', type: 'entrada', qty: 1, delta: 1, resultingQty: 1 },
    ])

    const movements = await getMovements(id)

    expect(movements.map((movement) => movement.type)).toEqual(['salida', 'ajuste', 'entrada'])
    expect(movements.every((movement) => movement.productId === id)).toBe(true)
  })

  it('exports no function that mutates movements (append-only log)', () => {
    const mutators = Object.keys(inventoryApi).filter((name) =>
      /update|delete|edit|remove/i.test(name),
    )
    expect(mutators).toEqual([])
  })

  it('keeps movements unchanged when the product catalog fields are edited', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await registerMovement(id, { type: 'entrada', qty: 4 })
    const before = await getMovements(id)

    await updateProduct(id, { title: 'Leche entera', brand: 'Alpura', customProps: [] })

    expect(await getMovements(id)).toEqual(before)
    expect((await getProduct(id))?.brand).toBe('Alpura')
  })
})
