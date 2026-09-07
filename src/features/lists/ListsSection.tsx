import { useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { addMember, removeMember } from './api'

/** "Listas" section of the product detail: the lists this product belongs to,
 * with quick membership add/remove. */
export function ListsSection({ productId }: { productId: number }) {
  const lists = useLiveQuery(() => db.lists.toArray(), []) ?? []
  const [pickedListId, setPickedListId] = useState('')
  const [error, setError] = useState('')

  const memberships = lists.filter((list) => list.productIds.includes(productId))
  const others = lists.filter((list) => !list.productIds.includes(productId))

  function reportError(fallback: string, cause?: unknown) {
    setError(cause instanceof Error ? cause.message : fallback)
  }

  async function handleAdd() {
    if (pickedListId === '') {
      setError('Elige una lista')
      return
    }
    try {
      await addMember(Number(pickedListId), productId)
      setPickedListId('')
      setError('')
    } catch (cause) {
      reportError('No se pudo agregar a la lista', cause)
    }
  }

  async function handleRemove(listId: number) {
    try {
      await removeMember(listId, productId)
      setError('')
    } catch (cause) {
      reportError('No se pudo quitar de la lista', cause)
    }
  }

  return (
    <section className="mt-6" aria-label="Listas">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Listas</h2>

      {memberships.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {memberships.map((list) => (
            <li
              key={list.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm"
            >
              <Link to={`/lists/${list.id}`} className="font-medium">
                {list.title}
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(list.id!)}
                aria-label={`Quitar de ${list.title}`}
                className="rounded-md border border-red-300 px-2 py-1 text-red-600"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Este producto no está en ninguna lista.</p>
      )}

      {others.length > 0 && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <label htmlFor="product-add-list" className="font-medium">
            Agregar a una lista
          </label>
          <div className="mt-1 flex gap-2">
            <select
              id="product-add-list"
              value={pickedListId}
              onChange={(event) => setPickedListId(event.target.value)}
              className="grow rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Elige una lista</option>
              {others.map((list) => (
                <option key={list.id} value={String(list.id)}>
                  {list.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-md border border-slate-300 px-3 py-1.5"
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  )
}
