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
}

export interface PurchaseLink {
  id: number
  url: string
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
}

export interface Product {
  id?: number
  title: string
  brand?: string
  contentSize?: string
  area?: string
  /** Variant family, e.g. "Leche" groups Lala/Nutri/Alpura products. */
  family?: string
  model?: string
  image?: Blob
  customProps: CustomProp[]
  stock: ProductStock
  purchase: ProductPurchase
  createdAt: string
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
  items: CartItem[]
}

export interface List {
  id?: number
  title: string
  productIds: number[]
  createdAt: string
}
