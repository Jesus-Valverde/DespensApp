// Supplier service (supplier-management spec): CRUD + reference-clearing delete.
// Validation throws Spanish Errors; forms catch and display them.

import { db } from '../../db/db'
import type { Product, Supplier } from '../../db/types'

export interface SupplierInput {
  name: string
  type?: string
  locations: string[]
}

function requireName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('El nombre del proveedor es obligatorio')
  return trimmed
}

export async function createSupplier(input: SupplierInput): Promise<number> {
  return db.suppliers.add({
    name: requireName(input.name),
    type: input.type,
    locations: input.locations,
  })
}

export async function updateSupplier(id: number, input: SupplierInput): Promise<void> {
  const existing = await db.suppliers.get(id)
  if (!existing) throw new Error('Proveedor no encontrado')
  await db.suppliers.put({
    ...existing,
    name: requireName(input.name),
    type: input.type,
    locations: input.locations,
  })
}

export async function listSuppliers(): Promise<Supplier[]> {
  return db.suppliers.toArray()
}

function referencesSupplier(product: Product, supplierId: number): boolean {
  return (
    product.purchase.primarySupplierId === supplierId ||
    product.purchase.secondarySupplierIds.includes(supplierId)
  )
}

export async function countProductsReferencing(supplierId: number): Promise<number> {
  const products = await db.products.toArray()
  return products.filter((product) => referencesSupplier(product, supplierId)).length
}

/** Deletes the supplier and clears every primary/secondary reference on products,
 * preserving all other purchase info (prices, dates, period). One transaction. */
export async function deleteSupplier(id: number): Promise<{ affectedProducts: number }> {
  return db.transaction('rw', db.products, db.suppliers, async () => {
    const products = await db.products.toArray()
    const affected = products.filter((product) => referencesSupplier(product, id))

    for (const product of affected) {
      const purchase = { ...product.purchase }
      if (purchase.primarySupplierId === id) delete purchase.primarySupplierId
      purchase.secondarySupplierIds = purchase.secondarySupplierIds.filter(
        (supplierId) => supplierId !== id,
      )
      await db.products.update(product.id!, { purchase })
    }

    await db.suppliers.delete(id)
    return { affectedProducts: affected.length }
  })
}
