import { describe, it, expect, beforeEach } from 'vitest'
import { createBackup, validateBackup, restoreBackup, backupFileName } from './backup'
import { db } from '../db/db'
import type { Product } from '../db/types'

const PNG_PIXEL = new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4])

async function seed(): Promise<number> {
  await db.suppliers.add({ name: 'Bodega Aurrerá', locations: ['Centro'] })
  return (await db.products.add({
    title: 'Leche',
    brand: 'Lala',
    customProps: [],
    stock: { current: 6, min: 2, max: 12, location: 'Refri' },
    purchase: { secondarySupplierIds: [], period: 'semanal', links: [] },
    image: new Blob([PNG_PIXEL], { type: 'image/png' }),
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  } as Product)) as number
}

beforeEach(async () => {
  await Promise.all([
    db.products.clear(),
    db.suppliers.clear(),
    db.carts.clear(),
    db.lists.clear(),
    db.movements.clear(),
  ])
})

describe('backup', () => {
  it('round-trips a full backup: restore replaces all tables and revives image blobs', async () => {
    const productId = await seed()
    await db.movements.add({
      productId,
      type: 'entrada',
      qty: 6,
      delta: 6,
      resultingQty: 6,
      date: '2026-09-05T10:00:00.000Z',
    })
    await db.carts.add({
      name: 'Súper',
      status: 'active',
      origin: 'manual',
      createdAt: '2026-09-02T00:00:00.000Z',
      items: [],
    })
    await db.lists.add({ title: 'Despensa mensual', productIds: [productId], createdAt: '2026-09-02T00:00:00.000Z' })

    const backup = await createBackup()

    // Portable JSON round-trip (what happens when the file leaves the device).
    const revived = validateBackup(JSON.parse(JSON.stringify(backup)))

    // Wipe local data and restore from the file.
    await db.products.clear()
    await db.movements.clear()
    expect(await db.products.count()).toBe(0)

    await restoreBackup(revived)

    expect(await db.products.count()).toBe(1)
    const restored = await db.products.get(productId)
    expect(restored?.title).toBe('Leche')
    expect(restored?.stock.current).toBe(6)
    // NOTE: fake-indexeddb degrades Blobs on clone (methods/bytes lost before
    // export), so full image fidelity can't be asserted here — it IS preserved
    // by the Dexie export in real browsers. We assert presence + type.
    expect(restored?.image).toBeTruthy()
    expect((restored?.image as { type?: string }).type).toBe('image/png')
    expect(await db.suppliers.count()).toBe(1)
    expect(await db.movements.count()).toBe(1)
    expect(await db.carts.count()).toBe(1)
    expect(await db.lists.count()).toBe(1)
  })

  it('rejects files that are not DespensApp backups', () => {
    expect(() => validateBackup({ hello: 'world' })).toThrow(
      'El archivo no es un respaldo de DespensApp válido',
    )
    expect(() => validateBackup(null)).toThrow('El archivo no es un respaldo de DespensApp válido')
    expect(() => validateBackup({ app: 'other-app', format: 1, payload: {} })).toThrow(
      'El archivo no es un respaldo de DespensApp válido',
    )
    expect(() => validateBackup({ app: 'despensapp', format: 1, payload: {} })).toThrow(
      'El archivo no es un respaldo de DespensApp válido',
    )
  })

  it('rejects backups from a newer format version', () => {
    expect(() =>
      validateBackup({ app: 'despensapp', format: 99, createdAt: '', payload: { data: { tables: [] } } }),
    ).toThrow('El respaldo fue creado con una versión más reciente de la app')
  })

  it('names the file with the backup date', () => {
    expect(backupFileName('2026-09-13T10:00:00.000Z')).toBe('despensapp-backup-2026-09-13.json')
  })
})
