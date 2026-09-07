import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
  buyCart,
  generateAutoCart,
} from './api'
import type { CartItem, Product } from '../../db/types'

beforeEach(async () => {
  await Promise.all([db.carts.clear(), db.products.clear(), db.suppliers.clear(), db.movements.clear()])
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

describe('buyCart', () => {
  beforeEach(() => {
    // Only Date is faked (timers stay real for Dexie/fake-indexeddb), so today()
    // is deterministic: 2026-09-06 local, matching the spec scenario dates.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 6, 10, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('buys a cart: entrada movement, last price/date updated, next date recomputed (spec scenario)', async () => {
    const leche = await makeProduct('Leche entera', {
      stock: { current: 2, min: 1, max: 12 },
      purchase: {
        secondarySupplierIds: [],
        lastPrice: 2600,
        lastPurchaseDate: '2026-08-30',
        nextPurchaseDate: '2026-09-06',
        period: 'semanal',
        links: [],
      },
    })
    const cartId = await createCart({ name: 'Súper de la semana' })
    await addCartItem(cartId, { productId: leche, qty: 6, unitPrice: 2800 })

    await buyCart(cartId)

    expect((await db.carts.get(cartId))?.status).toBe('purchased')
    expect((await db.carts.get(cartId))?.purchasedAt).toEqual(expect.any(String))

    expect((await db.products.get(leche))?.stock.current).toBe(8)
    const [movement] = await db.movements.where('productId').equals(leche).toArray()
    expect(movement).toMatchObject({
      productId: leche,
      type: 'entrada',
      qty: 6,
      delta: 6,
      resultingQty: 8,
      note: 'Compra: Súper de la semana',
    })

    expect((await db.products.get(leche))?.purchase).toMatchObject({
      lastPrice: 2800,
      lastPurchaseDate: '2026-09-06',
      nextPurchaseDate: '2026-09-13', // weekly: 2026-09-06 + 7 days
    })
  })

  it('applies per-item price overrides and unschedules products without a period', async () => {
    const leche = await makeProduct('Leche entera', {
      purchase: { secondarySupplierIds: [], lastPrice: 2600, period: 'semanal', links: [] },
    })
    const jabon = await makeProduct('Jabón de barra', {
      purchase: { secondarySupplierIds: [], lastPrice: 900, period: null, links: [] },
    })
    const cartId = await createCart({ name: 'Súper' })
    await addCartItem(cartId, { productId: leche, qty: 2, unitPrice: 2800 })
    await addCartItem(cartId, { productId: jabon, qty: 1, unitPrice: 900 })

    await buyCart(cartId, { [leche]: 3000 })

    expect((await db.products.get(leche))?.purchase.lastPrice).toBe(3000)
    expect((await db.products.get(jabon))?.purchase.lastPrice).toBe(900)
    expect((await db.products.get(jabon))?.purchase.nextPurchaseDate).toBeUndefined()
    // The stored cart reflects the price actually paid.
    const items = (await db.carts.get(cartId))?.items ?? []
    expect(items.find((item) => item.productId === leche)?.unitPrice).toBe(3000)
    expect(items.find((item) => item.productId === jabon)?.unitPrice).toBe(900)
  })

  it('rolls back everything when a step fails mid-purchase (spec: no partial state)', async () => {
    const leche = await makeProduct('Leche entera', {
      stock: { current: 2, min: null, max: null },
      purchase: { secondarySupplierIds: [], lastPrice: 2600, period: 'semanal', links: [] },
    })
    const jabon = await makeProduct('Jabón de barra')
    const cartId = await createCart({ name: 'Súper' })
    await addCartItem(cartId, { productId: leche, qty: 6, unitPrice: 2800 })
    await addCartItem(cartId, { productId: jabon, qty: 1, unitPrice: 900 })

    const realAdd = db.movements.add.bind(db.movements)
    let calls = 0
    const addSpy = vi.spyOn(db.movements, 'add').mockImplementation((...args: Parameters<typeof realAdd>) => {
      calls += 1
      // A native Promise is enough here; only the spy's declared return type
      // needs to satisfy Dexie's PromiseExtended.
      return (calls === 2
        ? Promise.reject(new Error('storage error'))
        : realAdd(...args)) as ReturnType<typeof realAdd>
    })

    await expect(buyCart(cartId)).rejects.toThrow('storage error')

    addSpy.mockRestore()
    expect(await db.movements.count()).toBe(0) // first entrada rolled back too
    expect((await db.products.get(leche))?.stock.current).toBe(2)
    expect((await db.products.get(jabon))?.stock.current).toBe(0)
    expect((await db.products.get(leche))?.purchase.lastPrice).toBe(2600)
    expect((await db.products.get(leche))?.purchase.lastPurchaseDate).toBeUndefined()
    const cart = await db.carts.get(cartId)
    expect(cart?.status).toBe('active')
    expect(cart?.purchasedAt).toBeUndefined()
    expect(cart?.items).toHaveLength(2)
  })

  it('rejects buying a cart that is missing or not active, and negative overrides', async () => {
    await expect(buyCart(9999)).rejects.toThrow('encontrado')

    const productId = await makeProduct('Leche entera')
    const cancelled = await createCart({ name: 'Cancelado' })
    await addCartItem(cancelled, { productId, qty: 1 })
    await cancelCart(cancelled)
    await expect(buyCart(cancelled)).rejects.toThrow('activo')

    const active = await createCart({ name: 'Súper' })
    await addCartItem(active, { productId, qty: 1, unitPrice: 2800 })
    await expect(buyCart(active, { [productId]: -1 })).rejects.toThrow('negativo')

    expect(await db.movements.count()).toBe(0)
    expect((await db.carts.get(active))?.status).toBe('active')
  })
})

describe('generateAutoCart', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 6, 10, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** A scheduled product due on `next` (default: overdue). */
  async function makeScheduled(title: string, next: string, supplierId: number | null, lastPrice?: number) {
    return makeProduct(title, {
      purchase: { primarySupplierId: supplierId ?? undefined, secondarySupplierIds: [], lastPrice, nextPurchaseDate: next, period: 'semanal', links: [] },
    })
  }

  it('creates an auto cart with all due products grouped by supplier (spec: auto-generate on app open)', async () => {
    const aurrera = (await db.suppliers.add({ name: 'Bodega Aurrerá', locations: [] })) as number
    const costco = (await db.suppliers.add({ name: 'Costco', locations: [] })) as number
    const detergente = await makeScheduled('Detergente', '2026-09-01', aurrera, 3050)
    const leche = await makeScheduled('Leche entera', '2026-09-06', costco)

    const cart = await generateAutoCart()

    expect(cart).toMatchObject({
      status: 'active',
      origin: 'auto',
      name: 'Carrito generado (6 de septiembre de 2026)',
    })
    expect(cart?.generatedAt).toEqual(expect.any(String))
    // Due-date order: 2026-09-01 before 2026-09-06 (today).
    expect(cart?.items).toEqual([
      { productId: detergente, title: 'Detergente', qty: 1, unitPrice: 3050, supplierId: aurrera, supplierName: 'Bodega Aurrerá' },
      { productId: leche, title: 'Leche entera', qty: 1, unitPrice: 0, supplierId: costco, supplierName: 'Costco' },
    ])
    expect(await db.carts.count()).toBe(1)
  })

  it('groups products without a primary supplier under Sin proveedor', async () => {
    const sal = await makeScheduled('Sal de grano', '2026-09-05', null, 1800)

    const cart = await generateAutoCart()

    expect(cart?.items).toEqual([
      { productId: sal, title: 'Sal de grano', qty: 1, unitPrice: 1800, supplierId: null, supplierName: 'Sin proveedor' },
    ])
  })

  it('skips not-yet-due and unscheduled products and those already in an active cart (spec: no duplicate)', async () => {
    const covered = await makeScheduled('Detergente', '2026-09-05', null)
    const future = await makeScheduled('Papel higiénico', '2026-09-10', null)
    await makeProduct('Sin calendario') // no nextPurchaseDate
    const activeId = await createCart({ name: 'Súper' })
    await addCartItem(activeId, { productId: covered, qty: 1 })

    // Every due product is already covered, so the trigger is a no-op.
    expect(await generateAutoCart()).toBeNull()
    expect(await db.carts.count()).toBe(1)
    expect(future).toBeDefined()
  })

  it('generates only the due products not covered by active carts', async () => {
    const covered = await makeScheduled('Detergente', '2026-09-01', null)
    const libre = await makeScheduled('Leche entera', '2026-09-06', null)
    const activeId = await createCart({ name: 'Súper' })
    await addCartItem(activeId, { productId: covered, qty: 1 })

    const cart = await generateAutoCart()

    expect(cart?.items.map((item) => item.productId)).toEqual([libre])
  })

  it('still generates products that only sit in purchased or cancelled carts', async () => {
    const detergente = await makeScheduled('Detergente', '2026-09-05', null)
    const purchasedId = await createCart({ name: 'Ya pagado' })
    await addCartItem(purchasedId, { productId: detergente, qty: 1 })
    await buyCart(purchasedId)
    const cancelledId = await createCart({ name: 'Cancelado' })
    await addCartItem(cancelledId, { productId: detergente, qty: 1 })
    await cancelCart(cancelledId)
    await db.products.update(detergente, {
      purchase: { secondarySupplierIds: [], nextPurchaseDate: '2026-09-05', period: 'semanal', links: [] },
    })

    const cart = await generateAutoCart()

    expect(cart?.items.map((item) => item.productId)).toEqual([detergente])
  })

  it('is a no-op when nothing is due: no cart is created (spec: none due)', async () => {
    await makeProduct('Leche entera') // unscheduled

    expect(await generateAutoCart()).toBeNull()
    expect(await db.carts.count()).toBe(0)
  })
})
