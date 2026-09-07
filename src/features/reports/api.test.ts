import { describe, it, expect } from 'vitest'
import type { Product } from '../../db/types'
import { outOfStock, upcomingPurchases } from './api'

/** Minimal product factory for the report selectors. */
function product(id: number, patch: Partial<Product> = {}): Product {
  return {
    id,
    title: `Producto ${id}`,
    customProps: [],
    stock: { current: 0, min: null, max: null },
    purchase: { secondarySupplierIds: [], period: null, links: [] },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...patch,
  }
}

describe('upcomingPurchases', () => {
  it('orders scheduled products by next date ascending, overdue first (spec: overdue items listed first)', () => {
    // "Today" for the spec scenario is 2026-09-06: 2026-09-01 is overdue,
    // 2026-09-10 and 2026-09-20 are upcoming. Ascending order puts the
    // overdue item first by construction.
    const upcoming = product(1, {
      title: 'Galletas',
      purchase: { secondarySupplierIds: [], period: 'semanal', links: [], nextPurchaseDate: '2026-09-10' },
    })
    const overdue = product(2, {
      title: 'Café',
      purchase: { secondarySupplierIds: [], period: 'mensual', links: [], nextPurchaseDate: '2026-09-01' },
    })
    const later = product(3, {
      title: 'Aceite',
      purchase: { secondarySupplierIds: [], period: 'quincenal', links: [], nextPurchaseDate: '2026-09-20' },
    })

    const result = upcomingPurchases([upcoming, later, overdue])

    expect(result.map((entry) => entry.title)).toEqual(['Café', 'Galletas', 'Aceite'])
  })

  it('excludes products without a next purchase date (spec: unscheduled product excluded)', () => {
    const noPeriod = product(1, { title: 'Sal', purchase: { secondarySupplierIds: [], period: null, links: [] } })
    const scheduled = product(2, {
      title: 'Café',
      purchase: { secondarySupplierIds: [], period: 'semanal', links: [], nextPurchaseDate: '2026-09-10' },
    })

    const result = upcomingPurchases([noPeriod, scheduled])

    expect(result.map((entry) => entry.title)).toEqual(['Café'])
  })
})

describe('outOfStock', () => {
  it('lists products at or below their minimum with the shortfall (spec: product at or below minimum appears)', () => {
    const arroz = product(1, { title: 'Arroz', stock: { current: 2, min: 2, max: null } })
    const frijol = product(2, { title: 'Frijol', stock: { current: 0, min: 5, max: null } })

    const result = outOfStock([arroz, frijol])

    expect(result).toEqual([
      { product: frijol, shortfall: 5 },
      { product: arroz, shortfall: 0 },
    ])
  })

  it('excludes products above their minimum or without thresholds (spec: product above minimum excluded)', () => {
    const above = product(1, { title: 'Leche', stock: { current: 10, min: 2, max: null } })
    const noMin = product(2, { title: 'Sal', stock: { current: 0, min: null, max: null } })

    const result = outOfStock([above, noMin])

    expect(result).toEqual([])
  })

  it('orders by largest shortfall first, breaking ties by title (spec: ordered by severity)', () => {
    const shortfall5 = product(1, { title: 'Frijol', stock: { current: 0, min: 5, max: null } })
    const shortfall1 = product(2, { title: 'Arroz', stock: { current: 4, min: 5, max: null } })
    const tieA = product(3, { title: 'Aceite', stock: { current: 1, min: 3, max: null } })
    const tieB = product(4, { title: 'Azucar', stock: { current: 0, min: 2, max: null } })

    const result = outOfStock([shortfall1, tieB, shortfall5, tieA])

    expect(result.map((entry) => entry.product.title)).toEqual([
      'Frijol', // shortfall 5
      'Aceite', // shortfall 2, tie broken by title (es: "Aceite" < "Azucar")
      'Azucar',
      'Arroz', // shortfall 1
    ])
  })
})
