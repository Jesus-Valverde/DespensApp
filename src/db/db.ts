import Dexie, { type EntityTable, type Transaction } from 'dexie'
import type { CustomProp, Product, ProductDef, Supplier, Movement, Cart, List } from './types'

export class DespensAppDB extends Dexie {
  products!: EntityTable<Product, 'id'>
  suppliers!: EntityTable<Supplier, 'id'>
  movements!: EntityTable<Movement, 'id'>
  carts!: EntityTable<Cart, 'id'>
  lists!: EntityTable<List, 'id'>
  productDefs!: EntityTable<ProductDef, 'id'>

  constructor() {
    super('despensapp')
    this.version(1).stores({
      products: '++id, title, area, purchase.nextPurchaseDate',
      suppliers: '++id, name',
      movements: '++id, productId, date',
      carts: '++id, status, createdAt',
      lists: '++id',
    })
    // v2: content/unit split of contentSize + product name templates.
    this.version(2)
      .stores({
        productDefs: '++id, title',
      })
      .upgrade((tx) => migrateV2(tx as unknown as Transaction))
  }
}

/** Canonical pack units, exact symbols used across form, detail and CSV. */
export const UNIT_SYMBOLS = ['L', 'ml', 'g', 'kg', 'pza', 'paq'] as const
export type UnitSymbol = (typeof UNIT_SYMBOLS)[number]

/** Splits a legacy `contentSize` ("500 ml") into content + unit. Values that
 * don't parse keep their raw text in `content` with no unit. */
export function parseContentSize(raw: string | undefined): { content?: string; unit?: string } {
  const text = raw?.trim()
  if (!text) return {}
  const match = text.match(/^(\S+)\s+(\S+)$/)
  if (!match) return { content: text }
  const [, value, unitRaw] = match
  const unit = UNIT_SYMBOLS.find((symbol) => symbol.toLowerCase() === unitRaw.toLowerCase())
  return unit ? { content: value, unit } : { content: text }
}

/** v1 → v2 data migration: parse contentSize and backfill productDefs from
 * existing product names (props of same-name products are merged, first
 * non-empty wins per key). */
async function migrateV2(tx: Transaction) {
  const products = await tx.table('products').toArray()
  for (const product of products) {
    if (typeof product.contentSize === 'string') {
      const { content, unit } = parseContentSize(product.contentSize)
      await tx.table('products').update(product.id, {
        ...(content ? { content } : {}),
        ...(unit ? { unit } : {}),
      })
    }
  }

  const defsByName = new Map<string, CustomProp[]>()
  for (const product of products) {
    const title = product.title?.trim()
    if (!title) continue
    const props = defsByName.get(title) ?? []
    for (const prop of product.customProps ?? []) {
      const key = prop.key?.trim()
      if (!key || props.some((seen) => seen.key === key)) continue
      props.push({ key, value: prop.value?.trim() ?? '' })
    }
    defsByName.set(title, props)
  }
  const now = new Date().toISOString()
  const defs = [...defsByName].map(([title, props]): ProductDef => ({ title, props, updatedAt: now }))
  if (defs.length > 0) await tx.table('productDefs').bulkAdd(defs)
}

export const db = new DespensAppDB()
