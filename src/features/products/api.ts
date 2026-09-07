// Product catalog service (product-catalog spec): CRUD with Spanish validation,
// cascade delete in one transaction, duplicate, and area autocomplete helper.

import { db } from '../../db/db'
import type { CustomProp, Product } from '../../db/types'

/** The "datos" slice of a product managed by the catalog form (stock and purchase
 * info are managed by their own screens in later increments). */
export interface ProductDatos {
  title: string
  brand?: string
  contentSize?: string
  area?: string
  model?: string
  image?: Blob
  customProps: CustomProp[]
}

function requireTitle(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) throw new Error('El nombre del producto es obligatorio')
  return trimmed
}

function validateCustomProps(props: CustomProp[]): CustomProp[] {
  const seen = new Set<string>()
  for (const prop of props) {
    const key = prop.key.trim()
    if (!key) throw new Error('La propiedad debe tener un nombre')
    if (seen.has(key)) throw new Error(`Ya existe la propiedad "${key}"`)
    seen.add(key)
  }
  return props
}

function validateDatos(datos: ProductDatos): ProductDatos {
  return {
    ...datos,
    title: requireTitle(datos.title),
    customProps: validateCustomProps(datos.customProps),
  }
}

export async function createProduct(datos: ProductDatos): Promise<number> {
  const valid = validateDatos(datos)
  const now = new Date().toISOString()
  const id = await db.products.add({
    title: valid.title,
    brand: valid.brand,
    contentSize: valid.contentSize,
    area: valid.area,
    model: valid.model,
    image: valid.image,
    customProps: valid.customProps,
    stock: { current: 0, min: null, max: null },
    purchase: { secondarySupplierIds: [], links: [], period: null },
    createdAt: now,
    updatedAt: now,
  })
  return id as number
}

export async function updateProduct(id: number, datos: ProductDatos): Promise<void> {
  const existing = await db.products.get(id)
  if (!existing) throw new Error('Producto no encontrado')
  const valid = validateDatos(datos)
  await db.products.put({
    ...existing,
    ...valid,
    image: valid.image, // explicitly re-set so clearing the image (undefined) takes effect
    updatedAt: new Date().toISOString(),
  })
}

/** Deletes the product and everything tied to it — movements, cart items and
 * list memberships — in a single transaction (design decision 8). */
export async function deleteProduct(id: number): Promise<void> {
  await db.transaction('rw', db.products, db.movements, db.carts, db.lists, async () => {
    await db.movements.where('productId').equals(id).delete()

    const carts = await db.carts.toArray()
    for (const cart of carts) {
      if (cart.items.some((item) => item.productId === id)) {
        await db.carts.put({ ...cart, items: cart.items.filter((item) => item.productId !== id) })
      }
    }

    const lists = await db.lists.toArray()
    for (const list of lists) {
      if (list.productIds.includes(id)) {
        await db.lists.put({ ...list, productIds: list.productIds.filter((productId) => productId !== id) })
      }
    }

    await db.products.delete(id)
  })
}

/** Copies all fields and purchase info into "… (copia)" with zeroed stock and
 * no movement history (duplicate-product spec). */
export async function duplicateProduct(id: number): Promise<number> {
  const source = await db.products.get(id)
  if (!source) throw new Error('Producto no encontrado')

  const now = new Date().toISOString()
  const copy: Product = {
    ...source,
    title: `${source.title} (copia)`,
    customProps: source.customProps.map((prop) => ({ ...prop })),
    stock: { ...source.stock, current: 0 },
    purchase: {
      ...source.purchase,
      secondarySupplierIds: [...source.purchase.secondarySupplierIds],
      links: source.purchase.links.map((link) => ({ ...link })),
    },
    createdAt: now,
    updatedAt: now,
  }
  delete copy.id
  return (await db.products.add(copy)) as number
}

export async function getProduct(id: number): Promise<Product | undefined> {
  return db.products.get(id)
}

/** Distinct, alphabetically sorted, non-empty areas of the given products. */
export function distinctAreas(products: Pick<Product, 'area'>[]): string[] {
  const areas = new Set<string>()
  for (const product of products) {
    const area = product.area?.trim()
    if (area) areas.add(area)
  }
  return [...areas].sort((a, b) => a.localeCompare(b, 'es'))
}
