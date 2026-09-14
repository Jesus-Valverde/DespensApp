// "Agregar a carrito" modal (Stitch design): pick a destination cart (or jump
// to the full creation form), set a quantity and add the product. Adding to a
// cart that already has the product merges quantities (addCartItem behavior).

import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Product } from '../../db/types'
import { formatMoney, parseMoney } from '../../lib/money'
import { iconPath, toneClasses } from '../../lib/icons'
import { useObjectUrl } from '../../lib/useObjectUrl'
import { addCartItem, createCart, listCarts } from './api'

const GLYPHS = {
  cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  cartPlus:
    'M2 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z M10 5h4 M12 3v4',
  cerrar: 'M6 18L18 6M6 6l12 12',
  check: 'M5 13l4 4L19 7',
  add: 'M12 5v14 M5 12h14',
  tienda: 'M3 9l1-5h16l1 5 M4 9v11a1 1 0 001 1h14a1 1 0 001-1V9 M4 9h16 M9 21v-6h6v6',
  bodega: 'M12 2 2 7.5 12 13l10-5.5L12 2z M2 16.5 12 22l10-5.5 M2 12l10 5 10-5',
  canasta: 'M5 11l1.5-6h11L19 11 M5 11h14l-1.4 8.2a1 1 0 01-1 .8H7.4a1 1 0 01-1-.8L5 11z M9 15h.01 M15 15h.01',
}

// Rotating icon chips for cart rows, like the design's storefront/warehouse/basket.
const CART_ICONS = [GLYPHS.tienda, GLYPHS.bodega, GLYPHS.canasta]

function Glyph({ d, className = 'h-5 w-5', strokeWidth = 2 }: { d: string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {d.split(' M').map((segment, index) => (
        <path key={index} d={index === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  )
}

export function AddToCartModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const carts = useLiveQuery(() => listCarts('active'), []) ?? []
  const imageUrl = useObjectUrl(product.image)
  const [pickedId, setPickedId] = useState<number | null>(null)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)

  // Preselect the newest active cart like the design's checked first row.
  useEffect(() => {
    if (pickedId == null && carts.length > 0) setPickedId(carts[0].id!)
  }, [carts, pickedId])

  async function handleAdd() {
    if (pickedId == null) {
      setError('Elige un carrito')
      return
    }
    setError('')
    setSaving(true)
    try {
      await addCartItem(pickedId, { productId: product.id!, qty })
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo agregar al carrito')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Agregar a carrito"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[92%] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3 pr-8">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100/80 bg-blue-50 text-blue-600 shadow-sm">
            <Glyph d={GLYPHS.cartPlus} className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-base font-bold leading-snug tracking-tight text-slate-900">Agregar a carrito</h3>
            <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500">
              Selecciona el carrito de destino o crea uno nuevo
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Cerrar modal"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-95"
        >
          <Glyph d={GLYPHS.cerrar} className="h-4 w-4" />
        </button>

        <div className="mt-3 flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-2.5 shadow-sm">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
          ) : (
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                product.iconKey ? toneClasses(product.iconTone) : 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d={iconPath(product.iconKey)} />
              </svg>
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {product.family && (
                <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100">
                  {product.family}
                </span>
              )}
              <span className="truncate text-[11px] font-medium text-slate-500">
                {[product.brand, product.purchase.lastPrice != null ? formatMoney(product.purchase.lastPrice) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
            <p className="truncate text-xs font-bold text-slate-900">{product.title}</p>
          </div>
        </div>

        <div className="mt-3 flex shrink-0 items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-2.5">
          <label htmlFor="cart-qty" className="text-xs font-bold text-slate-800">
            Cantidad a agregar
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Disminuir cantidad"
              onClick={() => setQty((value) => Math.max(1, value - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white font-bold text-slate-700 shadow-sm transition active:scale-95 hover:bg-slate-50"
            >
              −
            </button>
            <input
              id="cart-qty"
              type="number"
              inputMode="numeric"
              min="1"
              value={qty}
              onChange={(event) => setQty(Math.max(1, Number(event.target.value) || 1))}
              className="w-7 border-0 bg-transparent p-0 text-center text-sm font-bold text-slate-900 outline-none"
            />
            <button
              type="button"
              aria-label="Aumentar cantidad"
              onClick={() => setQty((value) => value + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm shadow-blue-500/25 transition active:scale-95 hover:bg-blue-700"
            >
              +
            </button>
          </div>
        </div>

        <h4 className="mb-2 mt-4 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500">
          Carritos activos
        </h4>

        <div className="flex-1 space-y-2.5 overflow-y-auto">
          {carts.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">No tienes carritos activos. Crea uno abajo.</p>
          )}
          {carts.map((cart, index) => {
            const selected = cart.id === pickedId
            const estimate = cart.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
            const supplier = cart.items[0]?.supplierName ?? 'Sin proveedor'
            return (
              <label
                key={cart.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-3 transition ${
                  selected
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="destino-carrito"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setPickedId(cart.id!)}
                />
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                      selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Glyph d={CART_ICONS[index % CART_ICONS.length]} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-xs ${
                        selected ? 'font-bold text-blue-900' : 'font-semibold text-slate-800'
                      }`}
                    >
                      {cart.name}
                    </span>
                    <span
                      className={`block truncate text-[10px] font-medium ${
                        selected ? 'text-blue-700/80' : 'text-slate-500'
                      }`}
                    >
                      Proveedor: {supplier} · {cart.items.length} arts. · Est.{' '}
                      {formatMoney(estimate).replace(' MXN', '')}
                    </span>
                  </span>
                </span>
                <span
                  className={`flex shrink-0 items-center justify-center rounded-full ${
                    selected
                      ? 'h-5 w-5 bg-blue-600 text-white shadow-sm'
                      : 'h-4 w-4 border border-slate-300 bg-white'
                  }`}
                >
                  {selected && <Glyph d={GLYPHS.check} className="h-3 w-3" strokeWidth={3} />}
                </span>
              </label>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-2.5 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-600 transition active:scale-95 hover:bg-slate-50"
        >
          <Glyph d={GLYPHS.add} className="h-4 w-4 text-slate-500" />
          Crear nuevo carrito
        </button>

        {creating && (
          <CreateCartModal
            onCancel={() => setCreating(false)}
            onCreated={(newId) => {
              setCreating(false)
              setPickedId(newId)
            }}
          />
        )}

        {error && (
          <p role="alert" className="mt-2 shrink-0 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-3 flex shrink-0 items-center gap-2.5 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
          >
            <Glyph d={GLYPHS.cart} className="h-4 w-4" />
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  )
}


/** "Crear nuevo carrito" modal (Stitch design): name, optional budget and
 * estimated date. On success the new cart id flows back so the pick list can
 * preselect it. */
export function CreateCartModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void
  onCreated: (cartId: number) => void
}) {
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const newId = await createCart({
        name,
        budget: budget.trim() === '' ? undefined : parseMoney(budget) ?? undefined,
        estimatedDate: date || undefined,
      })
      onCreated(newId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el carrito')
    } finally {
      setSaving(false)
    }
  }

  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700'
  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crear nuevo carrito"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl sm:p-6">
        <button
          type="button"
          aria-label="Cerrar modal"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-95"
        >
          <Glyph d={GLYPHS.cerrar} className="h-4 w-4" />
        </button>
        <div className="mb-3.5 flex items-center gap-3 pr-8">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100/80 bg-blue-50 text-blue-600 shadow-sm">
            <Glyph d={GLYPHS.cartPlus} className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-lg font-bold leading-snug tracking-tight text-slate-800">Crear nuevo carrito</h3>
            <p className="mt-0.5 text-xs leading-tight text-slate-500">
              Configura un nuevo carrito de compra para surtir tu despensa
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="cart-name" className={labelClass}>
              Nombre del carrito *
            </label>
            <input
              id="cart-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Súper Quincenal Walmart, Reposición…"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="cart-budget" className={labelClass}>
                Presupuesto (opc.)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-slate-500">$</span>
                <input
                  id="cart-budget"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-6 pr-10 text-xs font-bold text-slate-800 shadow-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <span className="absolute right-2.5 text-[10px] font-semibold text-slate-500">MXN</span>
              </div>
            </div>
            <div>
              <label htmlFor="cart-date" className={labelClass}>
                Fecha estimada
              </label>
              <input
                id="cart-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2.5 border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-3 text-xs font-medium text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
            >
              <Glyph d={GLYPHS.cart} className="h-4 w-4" />
              Crear carrito
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}