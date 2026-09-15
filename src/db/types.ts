// Domain entities for DespensApp (despensa-core design, Dexie schema v1).
// Dates are 'YYYY-MM-DD' strings; timestamps are ISO strings; money is integer centavos (MXN).

export type Period = 'semanal' | 'quincenal' | 'mensual' | null

export interface CustomProp {
  key: string
  value: string
}

export interface ProductStock {
  current: number
  min: number | null
  max: number | null
  location?: string
  alerts?: boolean
}

export interface PurchaseLink {
  id: number
  url: string
}

/** Per-supplier purchase metadata for a product (price in centavos). */
export interface SupplierLink {
  supplierId: number
  price?: number
  frequency?: Period
  url?: string
  notes?: string
}

export interface ProductPurchase {
  primarySupplierId?: number
  secondarySupplierIds: number[]
  originalPrice?: number
  lastPrice?: number
  lastPurchaseDate?: string
  nextPurchaseDate?: string
  period: Period
  links: PurchaseLink[]
  /** Optional so pre-existing records without it stay valid. */
  supplierLinks?: SupplierLink[]
}

export interface Product {
  id?: number
  title: string
  brand?: string
  /** Pack size value, e.g. "500" — displayed joined with `unit`. */
  content?: string
  /** Pack size unit symbol; one of the canonical units in features/products. */
  unit?: string
  area?: string
  /** Variant family, e.g. "Leche" groups Lala/Nutri/Alpura products. */
  family?: string
  model?: string
  description?: string
  image?: Blob
  /** Chosen visual: pantry icon key (see lib/icons) and its background tone. */
  iconKey?: string
  iconTone?: string
  customProps: CustomProp[]
  stock: ProductStock
  purchase: ProductPurchase
  createdAt: string
  updatedAt: string
}

/** Name template: one row per known product name, holding the custom props
 * suggested when that name is picked in the form. Joined to products by
 * `title` (no FK); props are only refreshed when a product ships some. */
export interface ProductDef {
  id?: number
  title: string
  props: CustomProp[]
  updatedAt: string
}

export interface Supplier {
  id?: number
  name: string
  type?: string
  locations: string[]
}

export type MovementType = 'entrada' | 'salida' | 'ajuste'

export interface Movement {
  id?: number
  productId: number
  date: string // ISO datetime
  type: MovementType
  qty: number
  delta: number
  resultingQty: number
  note?: string
}

export interface CartItem {
  productId: number
  title: string
  qty: number
  unitPrice: number
  supplierId: number | null
  supplierName: string
}

export type CartStatus = 'active' | 'purchased' | 'cancelled'
export type CartOrigin = 'manual' | 'auto'

export interface Cart {
  id?: number
  name: string
  status: CartStatus
  origin: CartOrigin
  createdAt: string
  generatedAt?: string
  purchasedAt?: string
  /** Planned spending cap in centavos. */
  budget?: number
  /** Planned purchase date, 'YYYY-MM-DD'. */
  estimatedDate?: string
  items: CartItem[]
}

export interface List {
  id?: number
  title: string
  /** Short visual key, e.g. 'carrito'; the UI maps it to a glyph. */
  icon?: string
  /** Short color key, e.g. 'azul'; the UI maps it to a Tailwind tone. */
  color?: string
  productIds: number[]
  createdAt: string
}
