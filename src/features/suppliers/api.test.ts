import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../db/db'
import type { Product } from '../../db/types'
import {
  createSupplier,
  updateSupplier,
  listSuppliers,
  countProductsReferencing,
  deleteSupplier,
} from './api'

beforeEach(async () => {
  await db.suppliers.clear()
  await db.products.clear()
})

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    title: 'Producto',
    customProps: [],
    stock: { current: 0, min: null, max: null },
    purchase: {
      secondarySupplierIds: [],
      links: [],
      period: 'semanal',
    },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('createSupplier / updateSupplier', () => {
  it('creates a supplier with name, type and locations and lists it', async () => {
    const id = await createSupplier({ name: 'Bodega Aurrerá', type: 'Supermercado', locations: ['Centro'] })

    expect(typeof id).toBe('number')
    const suppliers = await listSuppliers()
    expect(suppliers).toHaveLength(1)
    expect(suppliers[0]).toMatchObject({
      id,
      name: 'Bodega Aurrerá',
      type: 'Supermercado',
      locations: ['Centro'],
    })
  })

  it('rejects an empty name with a Spanish error and stores nothing', async () => {
    await expect(createSupplier({ name: '', locations: [] })).rejects.toThrow('nombre')
    await expect(createSupplier({ name: '   ', locations: [] })).rejects.toThrow('nombre')
    expect(await listSuppliers()).toHaveLength(0)
  })

  it('rejects an update with an empty name and keeps the supplier unchanged', async () => {
    const id = await createSupplier({ name: 'Bodega Aurrerá', locations: ['Centro'] })

    await expect(updateSupplier(id, { name: '', locations: [] })).rejects.toThrow('nombre')

    const stored = await db.suppliers.get(id)
    expect(stored?.name).toBe('Bodega Aurrerá')
  })

  it('rejects updating a supplier that does not exist', async () => {
    await expect(updateSupplier(9999, { name: 'Fantasma', locations: [] })).rejects.toThrow('encontrado')
  })

  it('edits a supplier so it shows both locations', async () => {
    const id = await createSupplier({ name: 'Bodega Aurrerá', locations: ['Centro'] })

    await updateSupplier(id, { name: 'Bodega Aurrerá', type: 'Supermercado', locations: ['Centro', 'Norte'] })

    const stored = await db.suppliers.get(id)
    expect(stored?.locations).toEqual(['Centro', 'Norte'])
    expect(stored?.type).toBe('Supermercado')
  })
})

describe('deleteSupplier with reference handling', () => {
  it('warns count, clears primary and secondary refs, preserves prices/dates/period', async () => {
    const supplierId = await createSupplier({ name: 'Bodega Aurrerá', locations: [] })
    const otherSupplierId = await createSupplier({ name: 'Otro', locations: [] })

    for (let i = 0; i < 3; i++) {
      await db.products.add(
        makeProduct({
          title: `Producto ${i}`,
          purchase: {
            primarySupplierId: supplierId,
            secondarySupplierIds: [otherSupplierId],
            originalPrice: 2550,
            lastPrice: 2999,
            lastPurchaseDate: '2026-08-01',
            nextPurchaseDate: '2026-09-01',
            period: 'quincenal',
            links: [],
          },
        }),
      )
    }

    expect(await countProductsReferencing(supplierId)).toBe(3)

    const result = await deleteSupplier(supplierId)

    expect(result.affectedProducts).toBe(3)
    expect(await db.suppliers.get(supplierId)).toBeUndefined()
    const products = await db.products.toArray()
    expect(products).toHaveLength(3)
    for (const product of products) {
      expect(product.purchase.primarySupplierId).toBeUndefined()
      expect(product.purchase.lastPrice).toBe(2999)
      expect(product.purchase.originalPrice).toBe(2550)
      expect(product.purchase.lastPurchaseDate).toBe('2026-08-01')
      expect(product.purchase.nextPurchaseDate).toBe('2026-09-01')
      expect(product.purchase.period).toBe('quincenal')
      // other supplier references survive
      expect(product.purchase.secondarySupplierIds).toEqual([otherSupplierId])
    }
  })

  it('counts a product only once when the supplier is both primary and secondary', async () => {
    const supplierId = await createSupplier({ name: 'Bodega Aurrerá', locations: [] })
    await db.products.add(
      makeProduct({
        purchase: { primarySupplierId: supplierId, secondarySupplierIds: [supplierId], links: [], period: null },
      }),
    )

    expect(await countProductsReferencing(supplierId)).toBe(1)
  })

  it('also clears secondary-only references', async () => {
    const supplierId = await createSupplier({ name: 'Bodega Aurrerá', locations: [] })
    await db.products.add(
      makeProduct({
        purchase: { secondarySupplierIds: [supplierId], links: [], period: null },
      }),
    )

    await deleteSupplier(supplierId)

    const [product] = await db.products.toArray()
    expect(product.purchase.secondarySupplierIds).toEqual([])
    expect(product.purchase.primarySupplierId).toBeUndefined()
  })

  it('deletes an unreferenced supplier with zero affected products', async () => {
    const supplierId = await createSupplier({ name: 'Sin uso', locations: [] })
    await db.products.add(makeProduct())

    expect(await countProductsReferencing(supplierId)).toBe(0)

    const result = await deleteSupplier(supplierId)

    expect(result.affectedProducts).toBe(0)
    expect(await db.suppliers.get(supplierId)).toBeUndefined()
    expect(await db.products.toArray()).toHaveLength(1)
  })
})
