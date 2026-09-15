// Product catalog service (product-catalog spec): CRUD with Spanish validation,
// cascade delete in one transaction, duplicate, and area autocomplete helpers.

import { db, UNIT_SYMBOLS } from '../../db/db'
import type { CustomProp, Product, ProductDef } from '../../db/types'

/** Unit select options: canonical symbol + Spanish name ("L - Litros"). */
export const UNIT_OPTIONS = (
  [
    ['L', 'Litros'],
    ['ml', 'Mililitros'],
    ['g', 'Gramos'],
    ['kg', 'Kilogramos'],
    ['pza', 'Piezas'],
    ['paq', 'Paquete'],
  ] as const
).map(([value, name]) => ({ value, label: `${value} - ${name}` }))

/** The "datos" slice of a product managed by the catalog form (stock and purchase
 * info are managed by their own screens in later increments). */
export interface ProductDatos {
  title: string
  brand?: string
  content?: string
  unit?: string
  area?: string
  family?: string
  model?: string
  description?: string
  image?: Blob
  iconKey?: string
  iconTone?: string
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
  const content = datos.content?.trim()
  const unit = datos.unit?.trim()
  const family = datos.family?.trim()
  const description = datos.description?.trim()
  const iconKey = datos.iconKey?.trim()
  if (unit && !(UNIT_SYMBOLS as readonly string[]).includes(unit)) {
    throw new Error('Unidad no válida (usa L, ml, g, kg, pza o paq)')
  }
  return {
    ...datos,
    title: requireTitle(datos.title),
    content: content || undefined,
    unit: unit || undefined,
    family: family || undefined,
    description: description || undefined,
    iconKey: iconKey || undefined,
    // A tone without an icon is meaningless — drop it.
    iconTone: iconKey ? datos.iconTone?.trim() || undefined : undefined,
    customProps: validateCustomProps(datos.customProps),
  }
}

/** Registers/refreshes the name template after saving a product: names are
 * always upserted (they feed the form dropdown); props only overwrite when
 * the product actually ships props (CSV imports carry none). Must run inside
 * a transaction that includes productDefs when called from updateProduct. */
async function writeProductDef(name: string, props: CustomProp[]): Promise<void> {
  const clean = props
    .map((prop) => ({ key: prop.key.trim(), value: prop.value.trim() }))
    .filter((prop) => prop.key)
  const existing = await db.productDefs.where('title').equals(name).first()
  if (!existing) {
    await db.productDefs.add({ title: name, props: clean, updatedAt: new Date().toISOString() })
  } else if (clean.length > 0) {
    // ponytail: case-sensitive title match — normalize if lookalike names appear.
    await db.productDefs.update(existing.id!, { props: clean, updatedAt: new Date().toISOString() })
  }
}

/** Loads the name template for a product title, if known. */
export async function getProductDef(title: string): Promise<ProductDef | undefined> {
  const name = title.trim()
  if (!name) return undefined
  return db.productDefs.where('title').equals(name).first()
}

export async function upsertProductDef(title: string, props: CustomProp[]): Promise<void> {
  const name = title.trim()
  if (!name) return
  await db.transaction('rw', db.productDefs, () => writeProductDef(name, props))
}

export async function createProduct(datos: ProductDatos): Promise<number> {
  const valid = validateDatos(datos)
  const now = new Date().toISOString()
  const id = await db.products.add({
    title: valid.title,
    brand: valid.brand,
    content: valid.content,
    unit: valid.unit,
    area: valid.area,
    family: valid.family,
    model: valid.model,
    description: valid.description,
    image: valid.image,
    iconKey: valid.iconKey,
    iconTone: valid.iconTone,
    customProps: valid.customProps,
    stock: { current: 0, min: null, max: null },
    purchase: { secondarySupplierIds: [], links: [], period: null },
    createdAt: now,
    updatedAt: now,
  })
  await writeProductDef(valid.title, valid.customProps)
  return id as number
}

export async function updateProduct(id: number, datos: ProductDatos): Promise<void> {
  const valid = validateDatos(datos)
  // Transaction-wrapped read-modify-write: a whole-record put outside a
  // transaction can revert concurrent stock/purchase writes from another tab.
  await db.transaction('rw', db.products, db.productDefs, async () => {
    const existing = await db.products.get(id)
    if (!existing) throw new Error('Producto no encontrado')
    await db.products.put({
      ...existing,
      ...valid,
      image: valid.image, // explicitly re-set so clearing the image (undefined) takes effect
      updatedAt: new Date().toISOString(),
    })
    await writeProductDef(valid.title, valid.customProps)
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
      supplierLinks: source.purchase.supplierLinks?.map((link) => ({ ...link })),
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

/** Distinct, alphabetically sorted, non-empty brands of the given products. */
export function distinctBrands(products: Pick<Product, 'brand'>[]): string[] {
  const brands = new Set<string>()
  for (const product of products) {
    const brand = product.brand?.trim()
    if (brand) brands.add(brand)
  }
  return [...brands].sort((a, b) => a.localeCompare(b, 'es'))
}

/** Distinct, alphabetically sorted, non-empty families of the given products. */
export function distinctFamilies(products: Pick<Product, 'family'>[]): string[] {
  const families = new Set<string>()
  for (const product of products) {
    const family = product.family?.trim()
    if (family) families.add(family)
  }
  return [...families].sort((a, b) => a.localeCompare(b, 'es'))
}
