import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../db/db'
import { createProduct } from '../products/api'
import {
  createCart,
  cancelCart,
  listCarts,
  addCartItem,
  updateCartItem,
  removeCartItem,
  groupCartItems,
  suggestedQty,
} from './api'
import type { CartItem, Product } from '../../db/types'

beforeEach(async () => {
  await Promise.all([db.carts.clear(), db.products.clear(), db.suppliers.clear()])
})

/** A product row with overrides over the defaults createProduct would set. */
async function makeProduct(title: string, overrides: Partial<Product> = {}): Promise<number> {
  const id = await createProduct({ title, customProps: [] })
  await db.products.update(id, overrides)
  return id
}

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

describe('addCartItem', () => {
  it('denormalizes the primary supplier and the last price (spec: add item with default supplier)', async () => {
    const supplierId = (await db.suppliers.add({ name: 'Bodega Aurrerá', locations: [] })) as number
    const productId = await makeProduct('Leche entera', {
      purchase: { primarySupplierId: supplierId, secondarySupplierIds: [], lastPrice: 2800, period: null, links: [] },
    })
    const cartId = await createCart({ name: 'Súper de la semana' })

    await addCartItem(cartId, { productId, qty: 2 })

    const cart = await db.carts.get(cartId)
    expect(cart?.items).toEqual([
      { productId, title: 'Leche entera', qty: 2, unitPrice: 2800, supplierId, supplierName: 'Bodega Aurrerá' },
    ])
  })

  it('falls back to Sin proveedor and zero price without purchase info', async () => {
    const productId = await makeProduct('Jabón de barra')
    const cartId = await createCart({ name: 'Súper' })

    await addCartItem(cartId, { productId, qty: 1 })

    expect((await db.carts.get(cartId))?.items).toEqual([
      { productId, title: 'Jabón de barra', qty: 1, unitPrice: 0, supplierId: null, supplierName: 'Sin proveedor' },
    ])
  })

  it('suggests the min-max gap as the default quantity, at least 1', async () => {
    const gap = await makeProduct('Cereal', { stock: { current: 2, min: 1, max: 6 } })
    const noMax = await makeProduct('Sal', { stock: { current: 3, min: null, max: null } })
    const overMax = await makeProduct('Azúcar', { stock: { current: 7, min: 1, max: 6 } })
    const cartId = await createCart({ name: 'Súper' })

    await addCartItem(cartId, { productId: gap })
    await addCartItem(cartId, { productId: noMax })
    await addCartItem(cartId, { productId: overMax })

    const items = (await db.carts.get(cartId))?.items ?? []
    expect(items.find((item) => item.productId === gap)?.qty).toBe(4)
    expect(items.find((item) => item.productId === noMax)?.qty).toBe(1)
    expect(items.find((item) => item.productId === overMax)?.qty).toBe(1)
  })

  it('merges the quantity when the product is already in the cart', async () => {
    const productId = await makeProduct('Leche entera')
    const cartId = await createCart({ name: 'Súper' })

    await addCartItem(cartId, { productId, qty: 2 })
    await addCartItem(cartId, { productId, qty: 3 })

    const items = (await db.carts.get(cartId))?.items ?? []
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ productId, qty: 5 })
  })

  it('rejects a non-positive quantity and a negative price with Spanish errors', async () => {
    const productId = await makeProduct('Leche entera')
    const cartId = await createCart({ name: 'Súper' })

    await expect(addCartItem(cartId, { productId, qty: 0 })).rejects.toThrow('cantidad')
    await expect(addCartItem(cartId, { productId, qty: 1.5 })).rejects.toThrow('cantidad')
    await expect(addCartItem(cartId, { productId, qty: 1, unitPrice: -1 })).rejects.toThrow('negativo')

    expect((await db.carts.get(cartId))?.items).toEqual([])
  })

  it('rejects adding to a cart that is missing or no longer active, or a missing product', async () => {
    const productId = await makeProduct('Leche entera')

    await expect(addCartItem(9999, { productId, qty: 1 })).rejects.toThrow('encontrado')

    const cartId = await createCart({ name: 'Súper' })
    await cancelCart(cartId)
    await expect(addCartItem(cartId, { productId, qty: 1 })).rejects.toThrow('activo')

    const activeId = await createCart({ name: 'Otro' })
    await expect(addCartItem(activeId, { productId: 9999, qty: 1 })).rejects.toThrow('encontrado')
  })
})

describe('updateCartItem', () => {
  it('updates quantity, price and regroups the supplier', async () => {
    const aurreraId = (await db.suppliers.add({ name: 'Bodega Aurrerá', locations: [] })) as number
    const costcoId = (await db.suppliers.add({ name: 'Costco', locations: [] })) as number
    const productId = await makeProduct('Leche entera', {
      purchase: { primarySupplierId: aurreraId, secondarySupplierIds: [], period: null, links: [] },
    })
    const cartId = await createCart({ name: 'Súper' })
    await addCartItem(cartId, { productId, qty: 2 })

    await updateCartItem(cartId, productId, { qty: 6, unitPrice: 3100, supplierId: costcoId })

    expect((await db.carts.get(cartId))?.items).toEqual([
      { productId, title: 'Leche entera', qty: 6, unitPrice: 3100, supplierId: costcoId, supplierName: 'Costco' },
    ])
  })

  it('clears the supplier to Sin proveedor and rejects invalid values', async () => {
    const supplierId = (await db.suppliers.add({ name: 'Costco', locations: [] })) as number
    const productId = await makeProduct('Leche entera', {
      purchase: { primarySupplierId: supplierId, secondarySupplierIds: [], period: null, links: [] },
    })
    const cartId = await createCart({ name: 'Súper' })
    await addCartItem(cartId, { productId, qty: 2 })

    await updateCartItem(cartId, productId, { supplierId: null })
    expect((await db.carts.get(cartId))?.items[0]).toMatchObject({ supplierId: null, supplierName: 'Sin proveedor' })

    await expect(updateCartItem(cartId, productId, { qty: 0 })).rejects.toThrow('cantidad')
    await expect(updateCartItem(cartId, productId, { unitPrice: -5 })).rejects.toThrow('negativo')
    await expect(updateCartItem(cartId, productId, { supplierId: 9999 })).rejects.toThrow('Proveedor no encontrado')
    await expect(updateCartItem(cartId, 9999, { qty: 1 })).rejects.toThrow('carrito')
  })
})

describe('removeCartItem', () => {
  it('removes the item and leaves the others in place', async () => {
    const leche = await makeProduct('Leche entera')
    const jabon = await makeProduct('Jabón de barra')
    const cartId = await createCart({ name: 'Súper' })
    await addCartItem(cartId, { productId: leche, qty: 2 })
    await addCartItem(cartId, { productId: jabon, qty: 1 })

    await removeCartItem(cartId, leche)

    const items = (await db.carts.get(cartId))?.items ?? []
    expect(items.map((item) => item.productId)).toEqual([jabon])
    await expect(removeCartItem(cartId, leche)).rejects.toThrow('carrito')
  })
})

describe('groupCartItems', () => {
  it('groups items by supplier in first-appearance order (spec: group by distinct suppliers)', () => {
    const items: CartItem[] = [
      { productId: 1, title: 'Leche', qty: 2, unitPrice: 2800, supplierId: 7, supplierName: 'Bodega Aurrerá' },
      { productId: 2, title: 'Papel', qty: 1, unitPrice: 900, supplierId: null, supplierName: 'Sin proveedor' },
      { productId: 3, title: 'Huevos', qty: 12, unitPrice: 4500, supplierId: 7, supplierName: 'Bodega Aurrerá' },
      { productId: 4, title: 'Atún', qty: 4, unitPrice: 1800, supplierId: 9, supplierName: 'Costco' },
    ]

    const groups = groupCartItems(items)

    expect(groups).toEqual([
      { supplierId: 7, supplierName: 'Bodega Aurrerá', items: [items[0], items[2]] },
      { supplierId: null, supplierName: 'Sin proveedor', items: [items[1]] },
      { supplierId: 9, supplierName: 'Costco', items: [items[3]] },
    ])
  })

  it('keeps distinct groups when the same supplier id appears with a renamed supplier', () => {
    const items: CartItem[] = [
      { productId: 1, title: 'Leche', qty: 1, unitPrice: 0, supplierId: 5, supplierName: 'Viejo nombre' },
      { productId: 2, title: 'Huevos', qty: 1, unitPrice: 0, supplierId: 5, supplierName: 'Costco' },
    ]

    const groups = groupCartItems(items)

    expect(groups).toHaveLength(1)
    expect(groups[0].items).toHaveLength(2)
    expect(groups[0].supplierName).toBe('Viejo nombre')
  })
})

describe('suggestedQty', () => {
  it('returns the gap to max, floored at 1, and 1 without a max', () => {
    expect(suggestedQty({ current: 2, max: 6 })).toBe(4)
    expect(suggestedQty({ current: 5, max: 6 })).toBe(1)
    expect(suggestedQty({ current: 7, max: 6 })).toBe(1)
    expect(suggestedQty({ current: 3, max: null })).toBe(1)
    expect(suggestedQty({ current: 0, max: null })).toBe(1)
  })
})
