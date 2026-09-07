import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../db/db'
import { createCart, cancelCart, listCarts } from './api'

beforeEach(async () => {
  await db.carts.clear()
})

describe('createCart', () => {
  it('creates a manual active cart with the given name (spec: create manual cart)', async () => {
    const id = await createCart({ name: 'Súper de la semana' })

    const cart = await db.carts.get(id)
    expect(cart).toMatchObject({
      name: 'Súper de la semana',
      status: 'active',
      origin: 'manual',
      items: [],
    })
    expect(cart?.createdAt).toEqual(expect.any(String))
  })

  it('rejects a blank name with a Spanish error and stores nothing', async () => {
    await expect(createCart({ name: '   ' })).rejects.toThrow('obligatorio')

    expect(await db.carts.count()).toBe(0)
  })
})

describe('cancelCart', () => {
  it('marks an active cart cancelled and keeps it as history (spec: cancel keeps history)', async () => {
    const id = await createCart({ name: 'Súper de la semana' })
    await db.carts.update(id, {
      items: [{ productId: 1, title: 'Leche entera', qty: 2, unitPrice: 2800, supplierId: null, supplierName: 'Sin proveedor' }],
    })

    await cancelCart(id)

    const cart = await db.carts.get(id)
    expect(cart?.status).toBe('cancelled')
    expect(cart?.items).toHaveLength(1) // history retained, items untouched
  })

  it('rejects cancelling a cart that does not exist', async () => {
    await expect(cancelCart(9999)).rejects.toThrow('encontrado')
  })

  it('rejects cancelling a cart that is no longer active', async () => {
    const id = await createCart({ name: 'Súper' })
    await cancelCart(id)

    await expect(cancelCart(id)).rejects.toThrow('activo')
  })
})

describe('listCarts', () => {
  it('allows several active carts at once and filters by status', async () => {
    const a = await createCart({ name: 'Súper' })
    const b = await createCart({ name: 'Costco' })
    const c = await createCart({ name: 'Cancelado' })
    await cancelCart(c)

    const active = await listCarts('active')
    expect(active.map((cart) => cart.id).sort()).toEqual([a, b].sort())

    const cancelled = await listCarts('cancelled')
    expect(cancelled.map((cart) => cart.name)).toEqual(['Cancelado'])

    expect(await listCarts()).toHaveLength(3)
  })
})
