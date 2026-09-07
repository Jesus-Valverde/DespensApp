import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Cart, CartStatus } from '../../db/types'
import { generateAutoCart } from './api'

export const CART_STATUS_LABEL: Record<CartStatus, string> = {
  active: 'Activo',
  purchased: 'Comprado',
  cancelled: 'Cancelado',
}

function cartSubtitle(cart: Cart): string {
  const count = cart.items.length
  const articles = count === 1 ? '1 artículo' : `${count} artículos`
  return `${articles} · ${CART_STATUS_LABEL[cart.status]}`
}

/** /carts — the cart list: active carts first, purchased/cancelled history
 * below, and the manual auto-generation trigger. */
export function CartsScreen() {
  const navigate = useNavigate()
  const carts = useLiveQuery(() => db.carts.toArray(), []) ?? []
  const [notice, setNotice] = useState('')

  const active = carts
    .filter((cart) => cart.status === 'active')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const history = carts
    .filter((cart) => cart.status !== 'active')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  async function handleGenerate() {
    setNotice('')
    try {
      const cart = await generateAutoCart()
      if (!cart) {
        setNotice('No hay productos pendientes de compra')
        return
      }
      navigate(`/carts/${cart.id}`)
    } catch {
      setNotice('No se pudo generar el carrito')
    }
  }

  return (
    <section>
      <h1 className="text-xl font-semibold">Carritos</h1>

      <button
        type="button"
        onClick={handleGenerate}
        className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Generar carrito
      </button>
      {notice && (
        <p role="alert" className="mt-2 text-sm text-slate-600">
          {notice}
        </p>
      )}

      {active.length > 0 ? (
        <section aria-label="Activos" className="mt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Activos</h2>
          <ul className="mt-2 space-y-2">
            {active.map((cart) => (
              <li key={cart.id}>
                <Link
                  to={`/carts/${cart.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 active:bg-slate-50"
                >
                  <span className="font-medium">{cart.name}</span>
                  <span className="mt-0.5 block text-sm text-slate-500">{cartSubtitle(cart)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          Sin carritos activos. Crea uno con el botón + o genera uno desde tus compras programadas.
        </p>
      )}

      {history.length > 0 && (
        <section aria-label="Historial" className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Historial</h2>
          <ul className="mt-2 space-y-2">
            {history.map((cart) => (
              <li key={cart.id}>
                <Link
                  to={`/carts/${cart.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 active:bg-slate-50"
                >
                  <span className="font-medium">{cart.name}</span>
                  <span className="mt-0.5 block text-sm text-slate-500">{cartSubtitle(cart)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
