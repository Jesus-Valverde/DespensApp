import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../db/db'
import { createList, renameList, deleteList, addMember, removeMember } from './api'

beforeEach(async () => {
  await Promise.all([db.lists.clear(), db.products.clear()])
})

async function makeProduct(title: string): Promise<number> {
  return (await db.products.add({
    title,
    customProps: [],
    stock: { current: 3, min: null, max: null },
    purchase: { secondarySupplierIds: [], period: null, links: [] },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  })) as number
}

describe('renameList', () => {
  it('renames a list, rejecting empty titles and unknown ids', async () => {
    const id = await createList({ title: 'Para el viaje' })

    await renameList(id, 'Súper del fin')
    expect((await db.lists.get(id))?.title).toBe('Súper del fin')

    await expect(renameList(id, '  ')).rejects.toThrow('El nombre de la lista es obligatorio')
    await expect(renameList(999, 'Otro')).rejects.toThrow('Lista no encontrada')
  })
})

describe('deleteList', () => {
  it('removes the list while preserving its member products (spec: delete list preserves products)', async () => {
    const atun = await makeProduct('Atún')
    const id = await createList({ title: 'Para el viaje' })
    const list = await db.lists.get(id)
    await db.lists.put({ ...list!, productIds: [atun] })

    await deleteList(id)

    expect(await db.lists.get(id)).toBeUndefined()
    const product = await db.products.get(atun)
    expect(product?.title).toBe('Atún')
    expect(product?.stock.current).toBe(3)
  })

  it('rejects deleting an unknown list', async () => {
    await expect(deleteList(999)).rejects.toThrow('Lista no encontrada')
  })
})

describe('addMember', () => {
  it('adds a product to the list (spec: add product to list)', async () => {
    const atun = await makeProduct('Atún')
    const id = await createList({ title: 'Para el viaje' })

    await addMember(id, atun)

    expect((await db.lists.get(id))?.productIds).toEqual([atun])
  })

  it('rejects a duplicate membership with a Spanish message (spec: reject duplicate membership)', async () => {
    const atun = await makeProduct('Atún')
    const id = await createList({ title: 'Para el viaje' })
    await addMember(id, atun)

    await expect(addMember(id, atun)).rejects.toThrow('El producto ya está en la lista')
    expect((await db.lists.get(id))?.productIds).toEqual([atun])
  })

  it('rejects unknown list or product ids', async () => {
    const atun = await makeProduct('Atún')
    const id = await createList({ title: 'Para el viaje' })

    await expect(addMember(999, atun)).rejects.toThrow('Lista no encontrada')
    await expect(addMember(id, 999)).rejects.toThrow('Producto no encontrado')
  })
})

describe('removeMember', () => {
  it('removes the product from the list while it stays in the catalog (spec: remove product from list)', async () => {
    const atun = await makeProduct('Atún')
    const pan = await makeProduct('Pan')
    const id = await createList({ title: 'Para el viaje' })
    await addMember(id, atun)
    await addMember(id, pan)

    await removeMember(id, atun)

    expect((await db.lists.get(id))?.productIds).toEqual([pan])
    expect(await db.products.get(atun)).toMatchObject({ title: 'Atún' })
  })

  it('rejects removing a product that is not in the list', async () => {
    const atun = await makeProduct('Atún')
    const id = await createList({ title: 'Para el viaje' })

    await expect(removeMember(id, atun)).rejects.toThrow('El producto no está en la lista')
  })
})

describe('createList', () => {
  it('creates a list that appears with zero products (spec: create list)', async () => {
    const id = await createList({ title: 'Para el viaje' })

    const list = await db.lists.get(id)
    expect(list).toMatchObject({ title: 'Para el viaje', productIds: [] })
  })

  it('rejects an empty title with a Spanish message (spec: reject empty list title)', async () => {
    await expect(createList({ title: '' })).rejects.toThrow('El nombre de la lista es obligatorio')
  })

  it('trims the title and rejects a whitespace-only one', async () => {
    const id = await createList({ title: '  Para el viaje  ' })
    expect((await db.lists.get(id))?.title).toBe('Para el viaje')

    await expect(createList({ title: '   ' })).rejects.toThrow('El nombre de la lista es obligatorio')
  })
})
