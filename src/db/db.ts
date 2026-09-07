import Dexie, { type EntityTable } from 'dexie'
import type { Product, Supplier, Movement, Cart, List } from './types'

export class DespensAppDB extends Dexie {
  products!: EntityTable<Product, 'id'>
  suppliers!: EntityTable<Supplier, 'id'>
  movements!: EntityTable<Movement, 'id'>
  carts!: EntityTable<Cart, 'id'>
  lists!: EntityTable<List, 'id'>

  constructor() {
    super('despensapp')
    this.version(1).stores({
      products: '++id, title, area, purchase.nextPurchaseDate',
      suppliers: '++id, name',
      movements: '++id, productId, date',
      carts: '++id, status, createdAt',
      lists: '++id',
    })
  }
}

export const db = new DespensAppDB()
