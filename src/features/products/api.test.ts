import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../db/db'
import { createProduct, updateProduct, deleteProduct, duplicateProduct, getProduct, distinctAreas, distinctFamilies } from './api'

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.movements.clear(), db.carts.clear(), db.lists.clear()])
})

describe('createProduct', () => {
  it('stores a product with title only and empty optional datos', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })

    const stored = await getProduct(id)
    expect(stored).toMatchObject({
      id,
      title: 'Leche entera',
      customProps: [],
      stock: { current: 0, min: null, max: null },
      purchase: { secondarySupplierIds: [], links: [], period: null },
    })
    expect(stored?.brand).toBeUndefined()
    expect(stored?.contentSize).toBeUndefined()
    expect(stored?.area).toBeUndefined()
    expect(stored?.createdAt).toEqual(expect.any(String))
  })

  it('rejects an empty title with a Spanish error and stores nothing', async () => {
    await expect(createProduct({ title: '', customProps: [] })).rejects.toThrow('nombre')
    await expect(createProduct({ title: '  ', customProps: [] })).rejects.toThrow('nombre')
    expect(await db.products.count()).toBe(0)
  })

  it('stores custom properties and the image blob', async () => {
    const image = new Blob(['jpeg'], { type: 'image/jpeg' })
    const id = await createProduct({
      title: 'Detergente',
      customProps: [{ key: 'Pagar con tarjeta', value: 'sí' }],
      image,
    })

    const stored = await getProduct(id)
    expect(stored?.customProps).toEqual([{ key: 'Pagar con tarjeta', value: 'sí' }])
    // Blobs are cloned on write by IndexedDB: compare content, not identity
    expect(stored?.image?.type).toBe('image/jpeg')
  })

  it('rejects a custom property with an empty key', async () => {
    await expect(
      createProduct({ title: 'X', customProps: [{ key: '  ', value: 'v' }] }),
    ).rejects.toThrow('nombre')
  })

  it('rejects duplicate custom property keys with a Spanish error', async () => {
    await expect(
      createProduct({
        title: 'X',
        customProps: [
          { key: 'Pagar con tarjeta', value: 'sí' },
          { key: 'Pagar con tarjeta', value: 'no' },
        ],
      }),
    ).rejects.toThrow('Ya existe la propiedad')
  })
})

describe('updateProduct', () => {
  it('updates datos fields while keeping stock, purchase and createdAt', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    const before = await getProduct(id)
    await db.products.update(id, { stock: { current: 5, min: 2, max: 10 } })

    await updateProduct(id, {
      title: 'Leche entera',
      brand: 'Alpura',
      area: 'Refri',
      customProps: [{ key: 'Orgánico', value: 'sí' }],
    })

    const stored = await getProduct(id)
    expect(stored?.brand).toBe('Alpura')
    expect(stored?.area).toBe('Refri')
    expect(stored?.customProps).toEqual([{ key: 'Orgánico', value: 'sí' }])
    expect(stored?.stock).toEqual({ current: 5, min: 2, max: 10 })
    expect(stored?.purchase.period).toBeNull()
    expect(stored?.createdAt).toBe(before?.createdAt)
    expect(stored?.updatedAt).not.toBe(before?.updatedAt)
  })

  it('rejects an update with an empty title and keeps the product', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })

    await expect(updateProduct(id, { title: '', customProps: [] })).rejects.toThrow('nombre')

    expect((await getProduct(id))?.title).toBe('Leche entera')
  })

  it('removes the image when the datos are saved without one', async () => {
    const id = await createProduct({
      title: 'Con foto',
      customProps: [],
      image: new Blob(['jpeg'], { type: 'image/jpeg' }),
    })

    await updateProduct(id, { title: 'Con foto', customProps: [] })

    expect((await getProduct(id))?.image).toBeUndefined()
  })
})

describe('deleteProduct cascade', () => {
  it('removes the product, its movements, cart items and list memberships in one go', async () => {
    const id = await createProduct({ title: 'Detergente', customProps: [] })
    const otherId = await createProduct({ title: 'Jabón', customProps: [] })

    await db.movements.bulkAdd([
      { productId: id, date: '2026-09-01T10:00:00.000Z', type: 'entrada', qty: 2, delta: 2, resultingQty: 2 },
      { productId: otherId, date: '2026-09-01T11:00:00.000Z', type: 'entrada', qty: 1, delta: 1, resultingQty: 1 },
    ])
    await db.carts.bulkAdd([
      {
        name: 'Súper',
        status: 'active',
        origin: 'manual',
        createdAt: '2026-09-01T00:00:00.000Z',
        items: [
          { productId: id, title: 'Detergente', qty: 1, unitPrice: 0, supplierId: null, supplierName: '' },
          { productId: otherId, title: 'Jabón', qty: 2, unitPrice: 0, supplierId: null, supplierName: '' },
        ],
      },
      {
        name: 'Histórico',
        status: 'purchased',
        origin: 'manual',
        createdAt: '2026-08-01T00:00:00.000Z',
        items: [
          { productId: id, title: 'Detergente', qty: 1, unitPrice: 0, supplierId: null, supplierName: '' },
        ],
      },
    ])
    await db.lists.bulkAdd([
      { title: 'Semanal', productIds: [id, otherId], createdAt: '2026-09-01T00:00:00.000Z' },
    ])

    await deleteProduct(id)

    expect(await db.products.get(id)).toBeUndefined()
    const remainingMovements = await db.movements.toArray()
    expect(remainingMovements).toHaveLength(1)
    expect(remainingMovements[0].productId).toBe(otherId)

    const [activeCart, purchasedCart] = await db.carts.orderBy('id').toArray()
    expect(activeCart.items.map((item) => item.productId)).toEqual([otherId])
    expect(purchasedCart.items).toEqual([])

    const [list] = await db.lists.toArray()
    expect(list.productIds).toEqual([otherId])

    const other = await getProduct(otherId)
    expect(other?.title).toBe('Jabón')
  })
})

describe('duplicateProduct', () => {
  it('copies fields and purchase info with "(copia)" title, zeroed stock and no movements', async () => {
    const image = new Blob(['jpeg'], { type: 'image/jpeg' })
    const id = await createProduct({
      title: 'Detergente',
      brand: 'Ace',
      contentSize: '1 L',
      area: 'Lavandería',
      customProps: [{ key: 'Pagar con tarjeta', value: 'sí' }],
      image,
    })
    await db.products.update(id, {
      stock: { current: 7, min: 2, max: 10, location: 'Estante 3' },
      purchase: {
        primarySupplierId: 4,
        secondarySupplierIds: [5],
        originalPrice: 2550,
        lastPrice: 2999,
        lastPurchaseDate: '2026-08-01',
        nextPurchaseDate: '2026-08-15',
        period: 'quincenal',
        links: [{ id: 1, url: 'https://ejemplo.mx' }],
      },
    })
    await db.movements.add({
      productId: id,
      date: '2026-09-01T10:00:00.000Z',
      type: 'entrada',
      qty: 7,
      delta: 7,
      resultingQty: 7,
    })

    const copyId = await duplicateProduct(id)

    expect(copyId).not.toBe(id)
    const copy = await getProduct(copyId)
    expect(copy?.title).toBe('Detergente (copia)')
    expect(copy?.brand).toBe('Ace')
    expect(copy?.contentSize).toBe('1 L')
    expect(copy?.area).toBe('Lavandería')
    expect(copy?.customProps).toEqual([{ key: 'Pagar con tarjeta', value: 'sí' }])
    expect(copy?.image?.type).toBe('image/jpeg')
    expect(copy?.stock).toEqual({ current: 0, min: 2, max: 10, location: 'Estante 3' })
    expect(copy?.purchase).toEqual({
      primarySupplierId: 4,
      secondarySupplierIds: [5],
      originalPrice: 2550,
      lastPrice: 2999,
      lastPurchaseDate: '2026-08-01',
      nextPurchaseDate: '2026-08-15',
      period: 'quincenal',
      links: [{ id: 1, url: 'https://ejemplo.mx' }],
    })
    // no movement history for the copy; original untouched
    expect(await db.movements.where('productId').equals(copyId!).count()).toBe(0)
    const original = await getProduct(id)
    expect(original?.stock.current).toBe(7)
    expect(await db.movements.where('productId').equals(id!).count()).toBe(1)
  })

  it('rejects duplicating a product that does not exist', async () => {
    await expect(duplicateProduct(9999)).rejects.toThrow('encontrado')
  })
})

describe('distinctAreas', () => {
  it('returns unique non-empty areas sorted alphabetically', () => {
    const products = [
      { area: 'Refri' },
      { area: 'Alacena' },
      { area: 'Refri' },
      { area: undefined },
      { area: '  ' },
      {},
    ]

    expect(distinctAreas(products)).toEqual(['Alacena', 'Refri'])
  })

  it('returns an empty list when no product has an area', () => {
    const products = [{ area: undefined }, {}]
    expect(distinctAreas(products)).toEqual([])
  })
})

describe('family (variant grouping, e.g. "Leche" for Lala/Nutri)', () => {
  it('stores a trimmed family and clears it when saved without one', async () => {
    const id = await createProduct({ title: 'Leche Lala', family: '  Leche  ', customProps: [] })
    expect((await getProduct(id))?.family).toBe('Leche')

    await updateProduct(id, { title: 'Leche Lala', customProps: [] })
    expect((await getProduct(id))?.family).toBeUndefined()
  })

  it('blank family is normalized to undefined on create', async () => {
    const id = await createProduct({ title: 'Leche Nutri', family: '   ', customProps: [] })
    expect((await getProduct(id))?.family).toBeUndefined()
  })

  it('duplicate copies the family', async () => {
    const id = await createProduct({ title: 'Leche Nutri', family: 'Leche', customProps: [] })
    const copyId = await duplicateProduct(id)
    expect((await getProduct(copyId))?.family).toBe('Leche')
  })

  it('distinctFamilies returns unique non-empty sorted values', () => {
    const products = [
      { family: 'Leche' },
      { family: 'Aguas' },
      { family: 'Leche' },
      { family: undefined },
      { family: '  ' },
      {},
    ]
    expect(distinctFamilies(products)).toEqual(['Aguas', 'Leche'])
  })
})
