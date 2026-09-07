// Inventory service (inventory-management spec): single global stock per product
// with min/max levels and one free-text location, plus the append-only movement
// log (entrada/salida/ajuste) and the bitácora query. Validation throws Spanish
// Errors; forms catch and display them.

import { db } from '../../db/db'
import type { Movement, MovementType, ProductStock } from '../../db/types'

export interface StockInput {
  current: number
  min: number | null
  max: number | null
  location?: string
}

function validateStock(stock: StockInput): ProductStock {
  const { current, min, max } = stock
  const quantities = [current, min, max] as const
  if (quantities.some((qty) => qty !== null && qty < 0)) {
    throw new Error('Las cantidades no pueden ser negativas')
  }
  if (min !== null && max !== null && min > max) {
    throw new Error('El mínimo no puede ser mayor que el máximo')
  }
  const location = stock.location?.trim()
  return location
    ? { current, min, max, location }
    : { current, min, max }
}

/** Sets the product's stock record (current, min, max, one free-text location). */
export async function setStock(productId: number, stock: StockInput): Promise<void> {
  const existing = await db.products.get(productId)
  if (!existing) throw new Error('Producto no encontrado')
  await db.products.update(productId, { stock: validateStock(stock), updatedAt: new Date().toISOString() })
}

export interface MovementInput {
  type: MovementType
  qty: number
  note?: string
}

/** Computes the delta and resulting stock for a movement against the current
 * quantity. entrada adds, salida subtracts (never below zero), ajuste targets
 * an absolute quantity (design movement semantics). */
export function movementResult(
  input: MovementInput,
  current: number,
): { delta: number; resultingQty: number } {
  if (input.type !== 'ajuste' && input.qty <= 0) {
    throw new Error('La cantidad debe ser mayor a cero')
  }
  if (input.type === 'ajuste' && input.qty < 0) {
    throw new Error('La cantidad no puede ser negativa')
  }
  if (input.type === 'salida' && input.qty > current) {
    throw new Error('La salida no puede ser mayor que el stock actual')
  }
  let delta: number
  switch (input.type) {
    case 'entrada':
      delta = input.qty
      break
    case 'salida':
      delta = -input.qty
      break
    case 'ajuste':
      delta = input.qty - current
      break
  }
  return { delta, resultingQty: current + delta }
}

/** Registers a stock movement (entrada/salida/ajuste) and updates the embedded
 * stock in one transaction; the movement log is append-only. */
export async function registerMovement(productId: number, input: MovementInput): Promise<void> {
  return db.transaction('rw', db.products, db.movements, async () => {
    const product = await db.products.get(productId)
    if (!product) throw new Error('Producto no encontrado')

    const { delta, resultingQty } = movementResult(input, product.stock.current)

    await db.movements.add({
      productId,
      date: new Date().toISOString(),
      type: input.type,
      qty: input.qty,
      delta,
      resultingQty,
      note: input.note,
    })

    await db.products.update(productId, {
      stock: { ...product.stock, current: resultingQty },
      updatedAt: new Date().toISOString(),
    })
  })
}

/** Bitácora: the product's movement log in reverse chronological order.
 * Read-only by design — the log is append-only and offers no mutations. */
export async function getMovements(productId: number): Promise<Movement[]> {
  const movements = await db.movements.where('productId').equals(productId).sortBy('date')
  return movements.reverse()
}
