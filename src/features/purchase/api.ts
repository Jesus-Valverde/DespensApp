// Purchase planning service (purchase-planning spec): the "Info de compra"
// form saves suppliers, prices, dates, period and links embedded in the
// product record. The next purchase date is always derived — period set means
// last date + period, no period means unscheduled (next unset). Validation
// throws Spanish Errors; forms catch and display them.

import { db } from '../../db/db'
import type { Period, ProductPurchase, PurchaseLink, SupplierLink } from '../../db/types'
import { addPeriod } from '../../lib/dates'
import { nextId } from '../../lib/id'

export interface PurchaseLinkInput {
  id?: number
  url: string
}

export interface PurchaseInfoInput {
  primarySupplierId?: number
  secondarySupplierIds: number[]
  originalPrice?: number
  lastPrice?: number
  lastPurchaseDate?: string
  period: Period
  /** Round-trip value from the form; validated when present, then recomputed
   * from the period (or cleared when the product is unscheduled). */
  nextPurchaseDate?: string
  links: PurchaseLinkInput[]
  /** Full replacement of the per-supplier metadata; when omitted the stored
   * supplierLinks are kept untouched. */
  supplierLinks?: SupplierLink[]
}

function isValidLinkUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function requireValidLinks(links: PurchaseLinkInput[]): void {
  for (const link of links) {
    if (!isValidLinkUrl(link.url)) {
      throw new Error('El enlace de compra no es válido')
    }
  }
}

function validatePurchaseInfo(input: PurchaseInfoInput): void {
  for (const price of [input.originalPrice, input.lastPrice]) {
    if (price != null && price < 0) throw new Error('El precio no puede ser negativo')
  }
  requireValidLinks(input.links)
  if (
    input.nextPurchaseDate &&
    input.lastPurchaseDate &&
    input.nextPurchaseDate < input.lastPurchaseDate
  ) {
    throw new Error('La próxima compra no puede ser anterior a la última compra')
  }
}

function withLinkIds(links: PurchaseLinkInput[]): PurchaseLink[] {
  const assigned: PurchaseLink[] = []
  for (const link of links) {
    const url = link.url.trim()
    assigned.push(link.id != null ? { id: link.id, url } : { id: nextId(assigned), url })
  }
  return assigned
}

const VALID_FREQUENCIES: Exclude<Period, null>[] = ['semanal', 'quincenal', 'mensual']

function normalizeSupplierLink(link: SupplierLink): SupplierLink {
  if (link.price != null && (Number.isNaN(link.price) || link.price < 0)) {
    throw new Error('El precio no puede ser negativo')
  }
  const url = link.url?.trim()
  const notes = link.notes?.trim()
  return {
    supplierId: link.supplierId,
    price: link.price,
    frequency: link.frequency != null && VALID_FREQUENCIES.includes(link.frequency) ? link.frequency : undefined,
    url: url || undefined,
    notes: notes || undefined,
  }
}

/** Upserts the per-supplier metadata for one supplier of a product. */
export async function saveSupplierLink(productId: number, link: SupplierLink): Promise<void> {
  const normalized = normalizeSupplierLink(link)
  await db.transaction('rw', db.products, async () => {
    const existing = await db.products.get(productId)
    if (!existing) throw new Error('Producto no encontrado')
    const supplierLinks = [...(existing.purchase.supplierLinks ?? [])]
    const index = supplierLinks.findIndex((entry) => entry.supplierId === normalized.supplierId)
    if (index >= 0) supplierLinks[index] = normalized
    else supplierLinks.push(normalized)
    await db.products.update(productId, {
      purchase: { ...existing.purchase, supplierLinks },
      updatedAt: new Date().toISOString(),
    })
  })
}

/** Saves the product's purchase info in one write. The stored next purchase
 * date is computed here — never trusted from the form. */
export async function savePurchaseInfo(productId: number, input: PurchaseInfoInput): Promise<void> {
  const existing = await db.products.get(productId)
  if (!existing) throw new Error('Producto no encontrado')
  validatePurchaseInfo(input)

  const purchase: ProductPurchase = {
    primarySupplierId: input.primarySupplierId,
    secondarySupplierIds: input.secondarySupplierIds,
    originalPrice: input.originalPrice,
    lastPrice: input.lastPrice,
    lastPurchaseDate: input.lastPurchaseDate,
    nextPurchaseDate:
      input.period && input.lastPurchaseDate
        ? addPeriod(input.lastPurchaseDate, input.period)
        : undefined,
    period: input.period,
    links: withLinkIds(input.links),
    // Full replacement when provided; otherwise keep what is already stored.
    supplierLinks: input.supplierLinks ?? existing.purchase.supplierLinks,
  }

  await db.products.update(productId, { purchase, updatedAt: new Date().toISOString() })
}
