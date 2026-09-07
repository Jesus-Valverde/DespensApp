// Cart service (cart-management spec): cart lifecycle (multiple active carts,
// purchased/cancelled retained as history), items denormalized per supplier,
// the atomic buy and auto-generation. Validation throws Spanish Errors.

import { db } from '../../db/db'
import type { Cart, CartOrigin, CartStatus } from '../../db/types'

export const NO_SUPPLIER = 'Sin proveedor'

export interface CartInput {
  name: string
  origin?: CartOrigin
}

function requireCartName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('El nombre del carrito es obligatorio')
  return trimmed
}

/** Creates a new active cart (origin defaults to a manual creation). */
export async function createCart(input: CartInput): Promise<number> {
  const id = await db.carts.add({
    name: requireCartName(input.name),
    status: 'active',
    origin: input.origin ?? 'manual',
    createdAt: new Date().toISOString(),
    items: [],
  })
  return id as number
}

/** Cancels an active cart; the cart and its items are retained as history. */
export async function cancelCart(id: number): Promise<void> {
  const existing = await db.carts.get(id)
  if (!existing) throw new Error('Carrito no encontrado')
  if (existing.status !== 'active') throw new Error('Solo se pueden cancelar carritos activos')
  await db.carts.update(id, { status: 'cancelled' })
}

/** Lists carts, optionally filtered by status, newest first. */
export async function listCarts(status?: CartStatus): Promise<Cart[]> {
  const carts = status ? await db.carts.where('status').equals(status).toArray() : await db.carts.toArray()
  return carts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
