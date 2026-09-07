// Report selectors (reporting spec): pure functions over the product catalog
// so the Inicio screen can compose them with useLiveQuery. On-screen only —
// export is out of scope.

import type { Product } from '../../db/types'

export interface OutOfStockEntry {
  product: Product
  /** min - current: how many units are missing to reach the minimum. */
  shortfall: number
}

/** "Faltantes": products whose current stock is at or below their minimum
 * (current <= min), largest shortfall first. Products without a minimum
 * threshold are excluded (nothing to compare against). */
export function outOfStock(products: Product[]): OutOfStockEntry[] {
  return products
    .filter((product) => product.stock.min != null && product.stock.current <= product.stock.min)
    .map((product) => ({ product, shortfall: product.stock.min! - product.stock.current }))
    .sort(
      (a, b) =>
        b.shortfall - a.shortfall || a.product.title.localeCompare(b.product.title, 'es'),
    )
}

/** "Próximas compras": scheduled products ordered by next purchase date
 * ascending — overdue items (today or earlier) sort first by construction.
 * Unscheduled products are excluded. */
export function upcomingPurchases(products: Product[]): Product[] {
  return products
    .filter((product) => product.purchase.nextPurchaseDate != null)
    .sort(
      (a, b) =>
        a.purchase.nextPurchaseDate!.localeCompare(b.purchase.nextPurchaseDate!) ||
        a.title.localeCompare(b.title, 'es'),
    )
}

