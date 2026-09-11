// Shopping-list service (shopping-lists spec): named lists with M—N product
// membership stored as the list's productIds array. Deleting a list never
// touches products. Validation throws Spanish Errors.

import { db } from '../../db/db'
import type { List } from '../../db/types'

function requireListTitle(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) throw new Error('El nombre de la lista es obligatorio')
  return trimmed
}

export interface ListInput {
  title: string
  icon?: string
  color?: string
}

/** Trims an optional string; empty or whitespace-only becomes undefined. */
function normalizeOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

/** Creates a list that starts with zero products. */
export async function createList(input: ListInput): Promise<number> {
  const id = await db.lists.add({
    title: requireListTitle(input.title),
    icon: normalizeOptional(input.icon),
    color: normalizeOptional(input.color),
    productIds: [],
    createdAt: new Date().toISOString(),
  })
  return id as number
}

/** Reads one list, throwing the Spanish not-found error otherwise. */
async function requireList(id: number): Promise<List> {
  const list = await db.lists.get(id)
  if (!list) throw new Error('Lista no encontrada')
  return list
}

/** Renames a list (title required, same validation as creation). */
export async function renameList(id: number, title: string): Promise<void> {
  await requireList(id)
  await db.lists.update(id, { title: requireListTitle(title) })
}

/** Deletes a list. Member products are preserved — membership lives in the
 * list row only (design decision 3). */
export async function deleteList(id: number): Promise<void> {
  await requireList(id)
  await db.lists.delete(id)
}

/** Adds a product to a list; duplicate membership in the same list is
 * rejected. The productIds read-modify-write runs in one transaction so
 * concurrent membership edits cannot clobber each other. */
export async function addMember(listId: number, productId: number): Promise<void> {
  return db.transaction('rw', db.lists, db.products, async () => {
    const list = await requireList(listId)
    if (list.productIds.includes(productId)) {
      throw new Error('El producto ya está en la lista')
    }
    if (!(await db.products.get(productId))) throw new Error('Producto no encontrado')
    await db.lists.update(listId, { productIds: [...list.productIds, productId] })
  })
}

/** Removes a product from a list; the product stays in the catalog. */
export async function removeMember(listId: number, productId: number): Promise<void> {
  return db.transaction('rw', db.lists, async () => {
    const list = await requireList(listId)
    if (!list.productIds.includes(productId)) {
      throw new Error('El producto no está en la lista')
    }
    await db.lists.update(listId, { productIds: list.productIds.filter((id) => id !== productId) })
  })
}
