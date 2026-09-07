// Inventory service (inventory-management spec): single global stock per product
// with min/max levels and one free-text location, plus the append-only movement
// log (entrada/salida/ajuste) and the bitácora query. Validation throws Spanish
// Errors; forms catch and display them.

import { db } from '../../db/db'
import type { ProductStock } from '../../db/types'

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
