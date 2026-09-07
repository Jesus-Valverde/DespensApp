import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../db/db'
import { createProduct, getProduct } from '../products/api'
import { savePurchaseInfo, type PurchaseInfoInput } from './api'

beforeEach(async () => {
  await db.products.clear()
  await db.suppliers.clear()
})

describe('savePurchaseInfo', () => {
  it('records supplier, prices, dates and links on the product (spec: record purchase info)', async () => {
    const supplierId = (await db.suppliers.add({ name: 'Soriana', locations: [] })) as number
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    await savePurchaseInfo(id, {
      primarySupplierId: supplierId,
      secondarySupplierIds: [],
      originalPrice: 2550,
      lastPrice: 3050,
      lastPurchaseDate: '2026-08-20',
      period: null,
      links: [{ url: 'https://soriana.com/detergente' }],
    })

    expect((await getProduct(id))?.purchase).toEqual({
      primarySupplierId: supplierId,
      secondarySupplierIds: [],
      originalPrice: 2550,
      lastPrice: 3050,
      lastPurchaseDate: '2026-08-20',
      nextPurchaseDate: undefined,
      period: null,
      links: [{ id: 1, url: 'https://soriana.com/detergente' }],
    })
  })

  it('rejects a negative price with a Spanish error and keeps the product unchanged', async () => {
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    await expect(
      savePurchaseInfo(id, {
        secondarySupplierIds: [],
        originalPrice: -1,
        period: null,
        links: [],
      }),
    ).rejects.toThrow('negativo')
    await expect(
      savePurchaseInfo(id, {
        secondarySupplierIds: [],
        lastPrice: -100,
        period: null,
        links: [],
      }),
    ).rejects.toThrow('negativo')

    expect((await getProduct(id))?.purchase).toEqual({
      secondarySupplierIds: [],
      links: [],
      period: null,
    })
  })

  it('computes the next purchase date as last date plus the weekly period (2026-09-01 → 2026-09-08)', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })

    await savePurchaseInfo(id, {
      secondarySupplierIds: [],
      lastPurchaseDate: '2026-09-01',
      period: 'semanal',
      links: [],
    })

    expect((await getProduct(id))?.purchase.nextPurchaseDate).toBe('2026-09-08')
  })

  it('unsets the next purchase date when the period is removed', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, {
      purchase: {
        secondarySupplierIds: [],
        lastPurchaseDate: '2026-08-01',
        nextPurchaseDate: '2026-09-01',
        period: 'mensual',
        links: [],
      },
    })

    await savePurchaseInfo(id, {
      secondarySupplierIds: [],
      lastPurchaseDate: '2026-08-01',
      period: null,
      links: [],
    })

    expect((await getProduct(id))?.purchase.nextPurchaseDate).toBeUndefined()
  })

  it('recomputes the next date when the last purchase date changes (quincenal: 2026-09-06 → 2026-09-20)', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, {
      purchase: {
        secondarySupplierIds: [],
        lastPurchaseDate: '2026-08-01',
        nextPurchaseDate: '2026-09-15',
        period: 'quincenal',
        links: [],
      },
    })

    await savePurchaseInfo(id, {
      secondarySupplierIds: [],
      lastPurchaseDate: '2026-09-06',
      period: 'quincenal',
      links: [],
    })

    expect((await getProduct(id))?.purchase.nextPurchaseDate).toBe('2026-09-20')
  })

  it('leaves the next date unset when a period is set but there is no last purchase date', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })

    await savePurchaseInfo(id, { secondarySupplierIds: [], period: 'semanal', links: [] })

    expect((await getProduct(id))?.purchase.nextPurchaseDate).toBeUndefined()
  })

  it('rejects an empty or non-http(s) link URL with a Spanish error', async () => {
    const id = await createProduct({ title: 'Detergente', customProps: [] })
    const base: Pick<PurchaseInfoInput, 'secondarySupplierIds' | 'period'> = {
      secondarySupplierIds: [],
      period: null,
    }

    await expect(savePurchaseInfo(id, { ...base, links: [{ url: '' }] })).rejects.toThrow('enlace')
    await expect(savePurchaseInfo(id, { ...base, links: [{ url: 'no-es-url' }] })).rejects.toThrow('enlace')
    await expect(savePurchaseInfo(id, { ...base, links: [{ url: 'ftp://tienda.com' }] })).rejects.toThrow('enlace')
    await expect(
      savePurchaseInfo(id, { ...base, links: [{ url: 'javascript:alert(1)' }] }),
    ).rejects.toThrow('enlace')

    expect((await getProduct(id))?.purchase.links).toEqual([])
  })

  it('accepts http(s) links, keeps existing ids and assigns fresh ids to new links', async () => {
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    await savePurchaseInfo(id, {
      secondarySupplierIds: [],
      period: null,
      links: [{ url: ' https://soriana.com/detergente ' }, { url: 'http://walmart.com/x' }],
    })
    await savePurchaseInfo(id, {
      secondarySupplierIds: [],
      period: null,
      links: [{ id: 2, url: 'http://walmart.com/x' }, { url: 'https://soriana.com/detergente' }],
    })

    expect((await getProduct(id))?.purchase.links).toEqual([
      { id: 2, url: 'http://walmart.com/x' },
      { id: 3, url: 'https://soriana.com/detergente' },
    ])
  })

  it('rejects a next purchase date earlier than the last purchase date', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })

    await expect(
      savePurchaseInfo(id, {
        secondarySupplierIds: [],
        lastPurchaseDate: '2026-09-06',
        nextPurchaseDate: '2026-09-01',
        period: null,
        links: [],
      }),
    ).rejects.toThrow('anterior')
  })

  it('allows a zero price and stores secondary suppliers', async () => {
    const id = await createProduct({ title: 'Regalo', customProps: [] })

    await savePurchaseInfo(id, {
      secondarySupplierIds: [4, 7],
      originalPrice: 0,
      lastPrice: 0,
      period: null,
      links: [],
    })

    expect((await getProduct(id))?.purchase).toMatchObject({
      secondarySupplierIds: [4, 7],
      originalPrice: 0,
      lastPrice: 0,
    })
  })

  it('rejects saving purchase info for a product that does not exist', async () => {
    await expect(
      savePurchaseInfo(9999, { secondarySupplierIds: [], period: null, links: [] }),
    ).rejects.toThrow('encontrado')
  })
})
