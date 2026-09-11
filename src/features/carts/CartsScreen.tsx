import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Cart, CartStatus } from '../../db/types'
import { formatMoney } from '../../lib/money'
import { generateAutoCart } from './api'
import { CreateCartModal } from './AddToCartModal'

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

function cartGlyph(index: number): string {
  // Rotating tinted chips for cart cards, echoing the add-to-cart modal.
  const tints = [
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
    'bg-amber-100 text-amber-600',
    'bg-violet-100 text-violet-600',
  ]
  return tints[index % tints.length]
}

function CartCard({ cart, tint }: { cart: Cart; tint: string }) {
  const estimate = cart.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  return (
    <Link
      to={`/carts/${cart.id}`}
      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition active:bg-slate-50"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-slate-900">{cart.name}</span>
        <span className="block truncate text-xs text-slate-400">{cartSubtitle(cart)}</span>
        {(cart.budget != null || cart.estimatedDate) && (
          <span className="block truncate text-[11px] font-medium text-slate-400">
            {cart.budget != null && <>Presupuesto: {formatMoney(cart.budget)} · </>}
            {cart.estimatedDate && <>Estimado: {cart.estimatedDate}</>}
          </span>
        )}
      </span>
      {cart.status === 'active' && cart.items.length > 0 && (
        <span className="shrink-0 text-right">
          <span className="block text-xs font-bold text-slate-800">
            {formatMoney(estimate).replace(' MXN', '')}
          </span>
          <span className="block text-[10px] font-medium text-slate-400">estimado</span>
        </span>
      )}
    </Link>
  )
}

/** /carts — the cart list: active carts first, purchased/cancelled history
 * below, and the auto-generation trigger from scheduled purchases. */
export function CartsScreen() {
  const navigate = useNavigate()
  const carts = useLiveQuery(() => db.carts.toArray(), []) ?? []
  const [notice, setNotice] = useState('')
  const [creating, setCreating] = useState(false)

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
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Carritos</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/60 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {active.length} Activos
        </span>
      </div>
      <p className="mb-5 text-xs font-medium text-slate-400">Gestión de compras y pedidos</p>

      {notice && (
        <p role="alert" className="mb-4 rounded-xl border border-slate-100 bg-white p-3 text-sm text-slate-600 shadow-sm">
          {notice}
        </p>
      )}

      {active.length > 0 ? (
        <section aria-label="Activos" className="space-y-2.5">
          {active.map((cart, index) => (
            <CartCard key={cart.id} cart={cart} tint={cartGlyph(index)} />
          ))}
        </section>
      ) : (
        <section
          aria-label="Sin carritos activos"
          className="mt-1 flex flex-col items-center rounded-3xl border border-slate-100/90 bg-white p-7 text-center shadow-sm"
        >
          <h2 className="mb-2 text-lg font-bold tracking-tight text-slate-900">No tienes carritos activos</h2>
          <p className="mb-6 max-w-[270px] text-sm leading-relaxed text-slate-500">
            Sin carritos activos. Crea uno con el botón + o genera uno desde tus compras programadas.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/35 transition-all hover:bg-blue-700 active:scale-[0.99]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              <line x1="12" x2="12" y1="6" y2="10" />
              <line x1="10" x2="14" y1="8" y2="8" />
            </svg>
            Crear carrito
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-3 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Generar desde compras programadas
          </button>
        </section>
      )}

      {creating && <CreateCartModal onCancel={() => setCreating(false)} onCreated={() => setCreating(false)} />}

      {history.length > 0 && (
        <section aria-label="Historial" className="mt-6 space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Historial</h2>
          {history.map((cart, index) => (
            <CartCard key={cart.id} cart={cart} tint={cartGlyph(index)} />
          ))}
        </section>
      )}
    </section>
  )
}
