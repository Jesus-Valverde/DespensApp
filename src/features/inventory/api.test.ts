import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../db/db'
import { createProduct, getProduct } from '../products/api'
import { setStock } from './api'

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
