import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { addMember, deleteList, removeMember } from './api'

/** /lists/:id — membership management: add any catalog product (duplicates
 * are rejected by the service with a Spanish message), remove members, and
 * delete the list without touching the products. */
export function ListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const listId = Number(id)
  const list = useLiveQuery(() => db.lists.get(listId), [listId])
  const products = useLiveQuery(() => db.products.orderBy('title').toArray(), []) ?? []

  const [pickedProductId, setPickedProductId] = useState('')
  const [error, setError] = useState('')

  if (!list) return <p className="mt-4 text-sm text-slate-500">Cargando…</p>
  const current = list

  const members = current.productIds
    .map((productId) => products.find((product) => product.id === productId))
    .filter((product) => product != null)

  function reportError(fallback: string, cause?: unknown) {
    setError(cause instanceof Error ? cause.message : fallback)
  }

  async function handleAdd() {
    if (pickedProductId === '') {
      setError('Elige un producto')
      return
    }
    try {
      await addMember(listId, Number(pickedProductId))
      setPickedProductId('')
      setError('')
    } catch (cause) {
      reportError('No se pudo agregar el producto', cause)
    }
  }

  async function handleRemove(productId: number) {
    try {
      await removeMember(listId, productId)
      setError('')
    } catch (cause) {
      reportError('No se pudo quitar el producto', cause)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar "${current.title}"? Los productos NO se borrarán del catálogo.`)) return
    try {
      await deleteList(listId)
      navigate('/lists')
    } catch (cause) {
      reportError('No se pudo eliminar la lista', cause)
    }
  }

  return (
    <section>
      <h1 className="text-xl font-semibold">{current.title}</h1>
      <p className="mt-0.5 text-sm text-slate-500">
        {members.length === 1 ? '1 producto' : `${members.length} productos`}
      </p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <label htmlFor="list-add-product" className="font-medium">
          Producto
        </label>
        <div className="mt-1 flex gap-2">
          <select
            id="list-add-product"
            value={pickedProductId}
            onChange={(event) => setPickedProductId(event.target.value)}
            className="grow rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Elige un producto</option>
            {products.map((product) => (
              <option key={product.id} value={String(product.id)}>
                {product.title}
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
        {error && (
          <p role="alert" className="mt-2 text-red-600">
            {error}
          </p>
        )}
      </div>

      {members.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {members.map((product) => (
            <li
              key={product.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm"
            >
              <Link to={`/products/${product.id}`} className="font-medium">
                {product.title}
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(product.id!)}
                className="rounded-md border border-red-300 px-2 py-1 text-red-600"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          Sin productos en esta lista.
        </p>
      )}

      <button
        type="button"
        onClick={handleDelete}
        className="mt-6 rounded-md border border-red-300 px-4 py-2 text-sm text-red-600"
      >
        Eliminar lista
      </button>
    </section>
  )
}
