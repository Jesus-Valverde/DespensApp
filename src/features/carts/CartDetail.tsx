import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { formatMoney, parseMoney } from '../../lib/money'
import { addCartItem, buyCart, cancelCart, groupCartItems, removeCartItem, updateCartItem } from './api'
import { CART_STATUS_LABEL } from './CartsScreen'

/** Draft edits for one item row: typed strings kept locally until blur. */
interface ItemDraft {
  qty?: string
  price?: string
}

/** /carts/:id — supplier-grouped items with qty/price editing, the buy flow
 * and cancellation. Prices are committed per item on blur and paid as stored. */
export function CartDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cartId = Number(id)
  const cart = useLiveQuery(() => db.carts.get(cartId), [cartId])
  const products = useLiveQuery(() => db.products.orderBy('title').toArray(), []) ?? []

  const [drafts, setDrafts] = useState<Record<number, ItemDraft>>({})
  const [error, setError] = useState('')
  const [pickedProductId, setPickedProductId] = useState('')
  const [pickedQty, setPickedQty] = useState('')

  if (!cart) return <p className="mt-4 text-sm text-slate-500">Cargando…</p>
  const current = cart
  const active = current.status === 'active'

  const groups = groupCartItems(current.items)
  const inCart = new Set(current.items.map((item) => item.productId))
  const available = products.filter((product) => !inCart.has(product.id!))
  const total = current.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)

  function setDraft(productId: number, patch: ItemDraft) {
    setDrafts((current) => ({ ...current, [productId]: { ...current[productId], ...patch } }))
  }

  function clearDraft(productId: number) {
    setDrafts((current) => {
      if (!(productId in current)) return current
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  function reportError(fallback: string, cause?: unknown) {
    setError(cause instanceof Error ? cause.message : fallback)
  }

  /** Blurs only commit pending drafts: a blur with no draft (untouched input,
   * or the second blur React fires when real focus moves away) is a no-op. */
  async function commitQty(productId: number) {
    const raw = drafts[productId]?.qty
    if (raw == null) return
    clearDraft(productId)
    try {
      await updateCartItem(cartId, productId, { qty: Number(raw) })
      setError('')
    } catch (cause) {
      reportError('No se pudo actualizar la cantidad', cause)
    }
  }

  async function commitPrice(productId: number) {
    const raw = drafts[productId]?.price
    if (raw == null) return
    clearDraft(productId)
    const parsed = parseMoney(raw)
    if (parsed === null) {
      setError('Ingresa un precio válido')
      return
    }
    try {
      await updateCartItem(cartId, productId, { unitPrice: parsed })
      setError('')
    } catch (cause) {
      reportError('No se pudo actualizar el precio', cause)
    }
  }

  async function handleAdd() {
    if (pickedProductId === '') {
      setError('Elige un producto')
      return
    }
    try {
      await addCartItem(cartId, {
        productId: Number(pickedProductId),
        qty: pickedQty === '' ? undefined : Number(pickedQty),
      })
      setPickedProductId('')
      setPickedQty('')
      setError('')
    } catch (cause) {
      reportError('No se pudo agregar el producto', cause)
    }
  }

  async function handleBuy() {
    if (!window.confirm(`¿Pagar "${current.name}"? Se registrarán las entradas de stock.`)) return
    try {
      await buyCart(cartId)
      navigate('/carts')
    } catch (cause) {
      reportError('No se pudo pagar el carrito', cause)
    }
  }

  async function handleCancel() {
    if (!window.confirm(`¿Cancelar "${current.name}"? Quedará en el historial.`)) return
    try {
      await cancelCart(cartId)
      navigate('/carts')
    } catch (cause) {
      reportError('No se pudo cancelar el carrito', cause)
    }
  }

  async function handleRemove(productId: number) {
    try {
      await removeCartItem(cartId, productId)
      setError('')
    } catch (cause) {
      reportError('No se pudo quitar el producto', cause)
    }
  }

  return (
    <section>
      <h1 className="text-xl font-semibold">{current.name}</h1>
      <p className="mt-0.5 text-sm text-slate-500">
        {CART_STATUS_LABEL[current.status]}
        {current.origin === 'auto' ? ' · generado automáticamente' : ''}
      </p>

      {active && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <div className="flex gap-2">
            <div className="grow">
              <label htmlFor="cart-add-product" className="font-medium">
                Producto
              </label>
              <select
                id="cart-add-product"
                value={pickedProductId}
                onChange={(event) => setPickedProductId(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">Elige un producto</option>
                {available.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label htmlFor="cart-add-qty" className="font-medium">
                Cantidad
              </label>
              <input
                id="cart-add-qty"
                type="number"
                inputMode="numeric"
                min="1"
                value={pickedQty}
                onChange={(event) => setPickedQty(event.target.value)}
                placeholder="Auto"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-3 rounded-md border border-slate-300 px-3 py-1.5"
          >
            Agregar
          </button>
        </div>
      )}

      {groups.length > 0 ? (
        groups.map((group) => (
          <section key={group.supplierId ?? 'none'} aria-label={group.supplierName} className="mt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {group.supplierName}
            </h2>
            <ul className="mt-2 space-y-2">
              {group.items.map((item) => {
                const draft = drafts[item.productId] ?? {}
                return (
                  <li
                    key={item.productId}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{item.title}</span>
                      <span>{formatMoney(item.qty * item.unitPrice)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <label className="sr-only" htmlFor={`cart-qty-${item.productId}`}>
                        Cantidad de {item.title}
                      </label>
                      <input
                        id={`cart-qty-${item.productId}`}
                        type="number"
                        inputMode="numeric"
                        min="1"
                        disabled={!active}
                        value={draft.qty ?? String(item.qty)}
                        onChange={(event) => setDraft(item.productId, { qty: event.target.value })}
                        onBlur={() => commitQty(item.productId)}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1"
                      />
                      <label className="sr-only" htmlFor={`cart-price-${item.productId}`}>
                        Precio de {item.title}
                      </label>
                      <input
                        id={`cart-price-${item.productId}`}
                        type="text"
                        inputMode="decimal"
                        disabled={!active}
                        value={draft.price ?? (item.unitPrice / 100).toFixed(2)}
                        onChange={(event) => setDraft(item.productId, { price: event.target.value })}
                        onBlur={() => commitPrice(item.productId)}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1"
                      />
                      {active && (
                        <button
                          type="button"
                          onClick={() => handleRemove(item.productId)}
                          className="ml-auto rounded-md border border-red-300 px-2 py-1 text-red-600"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          Sin productos en este carrito.
        </p>
      )}

      {current.items.length > 0 && (
        <p className="mt-4 text-right text-sm font-medium">Total: {formatMoney(total)}</p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {active && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleBuy}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Pagar carrito
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600"
          >
            Cancelar carrito
          </button>
        </div>
      )}
    </section>
  )
}
