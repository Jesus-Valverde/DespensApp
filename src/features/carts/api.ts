// Cart service (cart-management spec): cart lifecycle (multiple active carts,
// purchased/cancelled retained as history), items denormalized per supplier,
// the atomic buy and auto-generation. Validation throws Spanish Errors.

import { db } from '../../db/db'
import type { Cart, CartItem, CartOrigin, CartStatus, ProductStock } from '../../db/types'

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

/** Lists carts, optionally filtered by status, newest first. */
export async function listCarts(status?: CartStatus): Promise<Cart[]> {
  const carts = status ? await db.carts.where('status').equals(status).toArray() : await db.carts.toArray()
  return carts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function requireActiveCart(cartId: number): Promise<Cart> {
  const cart = await db.carts.get(cartId)
  if (!cart) throw new Error('Carrito no encontrado')
  if (cart.status !== 'active') throw new Error('Solo puedes modificar un carrito activo')
  return cart
}

function requireQty(qty: number): number {
  if (!Number.isInteger(qty) || qty <= 0) throw new Error('La cantidad debe ser mayor a cero')
  return qty
}

function requireUnitPrice(unitPrice: number): number {
  if (unitPrice < 0) throw new Error('El precio no puede ser negativo')
  return unitPrice
}

/** Suggested restock quantity: the gap up to max, at least 1 (design open
 * question: qty defaults are editable suggestions, never blockers). */
export function suggestedQty(stock: Pick<ProductStock, 'current' | 'max'>): number {
  return stock.max != null ? Math.max(1, stock.max - stock.current) : 1
}

/** Supplier display name, degrading to the no-supplier bucket when the id is
 * absent (or the supplier row was removed out-of-band). */
async function resolveSupplierName(supplierId: number | null): Promise<string> {
  if (supplierId == null) return NO_SUPPLIER
  const supplier = await db.suppliers.get(supplierId)
  return supplier?.name ?? NO_SUPPLIER
}

export interface CartItemInput {
  productId: number
  /** Defaults to the suggested restock quantity (min-max gap, min 1). */
  qty?: number
  /** Defaults to the product's last price, or zero when unknown. */
  unitPrice?: number
}

/** Adds a product to an active cart, denormalizing title, unit price and the
 * product's primary supplier. Re-adding a product merges quantities. */
export async function addCartItem(cartId: number, input: CartItemInput): Promise<void> {
  const cart = await requireActiveCart(cartId)
  const product = await db.products.get(input.productId)
  if (!product) throw new Error('Producto no encontrado')

  const qty = requireQty(input.qty ?? suggestedQty(product.stock))
  const unitPrice = requireUnitPrice(input.unitPrice ?? product.purchase.lastPrice ?? 0)
  const supplierId = product.purchase.primarySupplierId ?? null
  const supplierName = await resolveSupplierName(supplierId)

  const inCart = cart.items.some((item) => item.productId === input.productId)
  const items = inCart
    ? cart.items.map((item) =>
        item.productId === input.productId ? { ...item, qty: item.qty + qty } : item,
      )
    : [
        ...cart.items,
        { productId: input.productId, title: product.title, qty, unitPrice, supplierId, supplierName },
      ]
  await db.carts.update(cartId, { items })
}

export interface CartItemUpdate {
  qty?: number
  unitPrice?: number
  /** Explicit null moves the item to the "Sin proveedor" group. */
  supplierId?: number | null
}

/** Updates an item's quantity, price and/or supplier (editable per item). */
export async function updateCartItem(
  cartId: number,
  productId: number,
  changes: CartItemUpdate,
): Promise<void> {
  const cart = await requireActiveCart(cartId)
  const item = cart.items.find((item) => item.productId === productId)
  if (!item) throw new Error('El producto no está en el carrito')

  const updated: CartItem = { ...item }
  if (changes.qty != null) updated.qty = requireQty(changes.qty)
  if (changes.unitPrice != null) updated.unitPrice = requireUnitPrice(changes.unitPrice)
  if ('supplierId' in changes) {
    const supplierId = changes.supplierId ?? null
    if (supplierId != null && !(await db.suppliers.get(supplierId))) {
      throw new Error('Proveedor no encontrado')
    }
    updated.supplierId = supplierId
    updated.supplierName = await resolveSupplierName(supplierId)
  }

  await db.carts.update(cartId, {
    items: cart.items.map((item) => (item.productId === productId ? updated : item)),
  })
}

/** Removes a product from an active cart. */
export async function removeCartItem(cartId: number, productId: number): Promise<void> {
  const cart = await requireActiveCart(cartId)
  if (!cart.items.some((item) => item.productId === productId)) {
    throw new Error('El producto no está en el carrito')
  }
  await db.carts.update(cartId, { items: cart.items.filter((item) => item.productId !== productId) })
}

export interface SupplierGroup {
  supplierId: number | null
  supplierName: string
  items: CartItem[]
}

/** Groups cart items by supplier (logical grouping behind the visual one),
 * preserving first-appearance order. */
export function groupCartItems(items: CartItem[]): SupplierGroup[] {
  const groups: SupplierGroup[] = []
  for (const item of items) {
    const group = groups.find((group) => group.supplierId === item.supplierId)
    if (group) group.items.push(item)
    else groups.push({ supplierId: item.supplierId, supplierName: item.supplierName, items: [item] })
  }
  return groups
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
