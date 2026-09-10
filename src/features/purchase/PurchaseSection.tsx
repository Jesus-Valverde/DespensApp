import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Period, Product, ProductPurchase, Supplier } from '../../db/types'
import { savePurchaseInfo, type PurchaseLinkInput } from './api'
import { addMember } from '../lists/api'
import { formatDate } from '../../lib/dates'
import { formatMoney, parseMoney } from '../../lib/money'

const PERIOD_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Sin período' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
]

const PERIOD_LABEL: Record<Exclude<Period, null>, string> = {
  semanal: 'Semanal',
  quincenal: 'Quincenal',
  mensual: 'Mensual',
}

const GLYPHS = {
  bag: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0',
  store: 'M4 9l1-5h14l1 5 M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9 M4 9h16 M9 20v-6h6v6',
  edit: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  open: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3',
  cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  trendDown: 'M3 7l6 6 4-4 8 8 M17 13h4v4',
  trendUp: 'M3 17l6-6 4 4 8-8 M17 11h4V7',
  add: 'M12 5v14 M5 12h14',
  chevron: 'M9 18l6-6-6-6',
}

function Glyph({ d, className = 'h-5 w-5' }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
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

interface PurchaseFormValue {
  primary: string // supplier id as a string, '' = none
  secondary: number[]
  originalPrice: string
  lastPrice: string
  lastDate: string // 'YYYY-MM-DD' or ''
  period: string // '', 'semanal', 'quincenal', 'mensual'
  links: PurchaseLinkInput[]
}

function toFormValue(purchase: ProductPurchase): PurchaseFormValue {
  return {
    primary: purchase.primarySupplierId != null ? String(purchase.primarySupplierId) : '',
    secondary: [...purchase.secondarySupplierIds],
    originalPrice: purchase.originalPrice != null ? (purchase.originalPrice / 100).toFixed(2) : '',
    lastPrice: purchase.lastPrice != null ? (purchase.lastPrice / 100).toFixed(2) : '',
    lastDate: purchase.lastPurchaseDate ?? '',
    period: purchase.period ?? '',
    links: purchase.links.map((link) => ({ ...link })),
  }
}

/** Parses a price field: empty → undefined (unset), invalid → null (form error),
 * anything else (including negatives) flows to the api for its message. */
function parsePriceField(value: string): number | null | undefined {
  if (value.trim() === '') return undefined
  return parseMoney(value)
}

export function PurchaseSection({ product }: { product: Product }) {
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []) ?? []
  const lists = useLiveQuery(() => db.lists.toArray(), []) ?? []
  const [form, setForm] = useState<PurchaseFormValue>(() => toFormValue(product.purchase))
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [error, setError] = useState('')
  // The design shows the read-only card; the form lives behind "Ver todos".
  const [editing, setEditing] = useState(false)
  const [pickedListId, setPickedListId] = useState('')
  const [listPickerOpen, setListPickerOpen] = useState(false)
  const [listError, setListError] = useState('')

  const sortedSuppliers = [...suppliers].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const supplierName = (id: number | undefined) =>
    id == null ? undefined : sortedSuppliers.find((supplier: Supplier) => supplier.id === id)?.name

  const purchase = product.purchase
  const primaryName = supplierName(purchase.primarySupplierId)
  const trend =
    purchase.lastPrice != null && purchase.originalPrice != null && purchase.originalPrice > 0
      ? Math.round(((purchase.lastPrice - purchase.originalPrice) / purchase.originalPrice) * 100)
      : null
  const firstLink = purchase.links[0]
  const memberships = lists.filter((list) => product.id != null && list.productIds.includes(product.id))
  const others = lists.filter((list) => product.id == null || !list.productIds.includes(product.id))

  function toggleSecondary(supplierId: number) {
    setForm((current) => ({
      ...current,
      secondary: current.secondary.includes(supplierId)
        ? current.secondary.filter((id) => id !== supplierId)
        : [...current.secondary, supplierId],
    }))
  }

  function addLink() {
    const url = newLinkUrl.trim()
    if (!url) return
    setForm((current) => ({ ...current, links: [...current.links, { url }] }))
    setNewLinkUrl('')
  }

  function removeLink(index: number) {
    setForm((current) => ({ ...current, links: current.links.filter((_, i) => i !== index) }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const originalPrice = parsePriceField(form.originalPrice)
    const lastPrice = parsePriceField(form.lastPrice)
    if (originalPrice === null || lastPrice === null) {
      setError('Ingresa un precio válido')
      return
    }
    const primarySupplierId = form.primary === '' ? undefined : Number(form.primary)
    try {
      await savePurchaseInfo(product.id!, {
        primarySupplierId,
        secondarySupplierIds: form.secondary.filter((id) => id !== primarySupplierId),
        originalPrice,
        lastPrice,
        lastPurchaseDate: form.lastDate || undefined,
        period: (form.period || null) as Period,
        links: form.links,
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar la info de compra')
    }
  }

  async function handleAddToList() {
    if (pickedListId === '') {
      setListError('Elige una lista')
      return
    }
    try {
      await addMember(Number(pickedListId), product.id!)
      setPickedListId('')
      setListPickerOpen(false)
      setListError('')
    } catch (cause) {
      setListError(cause instanceof Error ? cause.message : 'No se pudo agregar a la lista')
    }
  }

  return (
    <section aria-label="Info de compra" className="mt-6 space-y-4">
      <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Glyph d={GLYPHS.bag} className="text-lg text-amber-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Información de compra</h4>
          </div>
          <button
            type="button"
            onClick={() => setEditing((current) => !current)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            {editing ? 'Ocultar' : 'Ver todos'}
            <Glyph d={GLYPHS.chevron} className={`h-3.5 w-3.5 transition-transform ${editing ? 'rotate-90' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-blue-600 shadow-sm">
              <Glyph d={GLYPHS.store} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">{primaryName ?? 'Sin proveedor'}</p>
              <p className="text-[10px] font-medium text-slate-400">Proveedor principal</p>
            </div>
          </div>
          {primaryName && (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              Principal
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <span className="mb-1 text-sm font-medium text-slate-500">Último precio</span>
            <div className="my-0.5 flex items-baseline gap-1">
              {purchase.lastPrice != null ? (
                <>
                  <span className="text-2xl font-black tracking-tight text-slate-900">
                    {formatMoney(purchase.lastPrice).replace(' MXN', '')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">MXN</span>
                </>
              ) : (
                <span className="text-2xl font-black tracking-tight text-slate-300">—</span>
              )}
            </div>
            {trend !== null && trend !== 0 ? (
              <div
                className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${
                  trend < 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                <Glyph d={trend < 0 ? GLYPHS.trendDown : GLYPHS.trendUp} className="h-3.5 w-3.5" />
                <span>
                  {trend > 0 ? `+${trend}%` : `${trend}%`} vs habitual
                </span>
              </div>
            ) : (
              <span className="mt-1.5 text-xs font-normal text-slate-500">Sin referencia</span>
            )}
          </div>
          <div className="flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <span className="mb-1 text-sm font-medium text-slate-500">Precio referencia</span>
            <div className="my-0.5 flex items-baseline gap-1 text-2xl font-bold tracking-tight text-slate-400">
              {purchase.originalPrice != null ? (
                <>
                  <span className="line-through">{formatMoney(purchase.originalPrice).replace(' MXN', '')}</span>
                  <span className="text-xs font-semibold text-slate-400 no-underline">MXN</span>
                </>
              ) : (
                <span className="text-slate-300">—</span>
              )}
            </div>
            <span className="mt-1.5 text-xs font-normal text-slate-500">Máximo sugerido</span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-3 text-xs">
          <div>
            <dt className="text-[11px] font-medium text-slate-400">Última compra</dt>
            <dd className="mt-0.5 text-xs font-bold text-slate-800">
              {purchase.lastPurchaseDate ? formatDate(purchase.lastPurchaseDate) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-slate-400">Frecuencia</dt>
            <dd className="mt-0.5 text-xs font-bold text-slate-800">
              {purchase.period ? PERIOD_LABEL[purchase.period] : '—'}
            </dd>
          </div>
          {purchase.nextPurchaseDate && (
            <div>
              <dt className="text-[11px] font-medium text-slate-400">Próxima compra</dt>
              <dd className="mt-0.5 text-xs font-bold text-slate-800">
                {formatDate(purchase.nextPurchaseDate)}
              </dd>
            </div>
          )}
        </dl>

        {firstLink && (
          <a
            href={firstLink.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir tienda en línea"
            className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50/60"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Glyph d={GLYPHS.link} className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-blue-600" />
              <span className="truncate">{firstLink.url}</span>
            </span>
            <Glyph d={GLYPHS.open} className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-blue-600" />
          </a>
        )}

        <Link
          to="/carts/new"
          className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-blue-600 px-4 py-3 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50/50 active:scale-95"
        >
          <Glyph d={GLYPHS.cart} className="h-4 w-4" />
          Agregar al carrito
        </Link>
      </div>

      <div className="space-y-3.5 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Glyph d={GLYPHS.bag} className="text-lg text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Listas asignadas (compra)</h4>
          </div>
          <Link to="/lists" className="flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:underline">
            <Glyph d={GLYPHS.add} className="h-3.5 w-3.5" />
            Gestionar
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
          {memberships.map((list) => (
            <Link
              key={list.id}
              to={`/lists/${list.id}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-sm"
            >
              <Glyph d={GLYPHS.cart} className="h-4 w-4 text-blue-600" />
              {list.title}
            </Link>
          ))}
          {others.length > 0 && !listPickerOpen && (
            <button
              type="button"
              onClick={() => setListPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition active:scale-95 hover:bg-slate-50"
            >
              <Glyph d={GLYPHS.add} className="h-4 w-4 text-slate-400" />
              Añadir a lista
            </button>
          )}
          {others.length > 0 && listPickerOpen && (
            <span className="inline-flex items-center gap-1.5">
              <select
                aria-label="Agregar a una lista"
                value={pickedListId}
                onChange={(event) => setPickedListId(event.target.value)}
                className="max-w-40 rounded-2xl border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-600"
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
                onClick={handleAddToList}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium transition-all active:scale-95"
              >
                Agregar
              </button>
            </span>
          )}
        </div>
        {listError && (
          <p role="alert" className="text-sm text-red-600">
            {listError}
          </p>
        )}
      </div>

      {editing && (
        <form
          onSubmit={handleSubmit}
          className="mt-2 space-y-3 rounded-2xl border border-slate-100 bg-white p-5 text-sm shadow-sm"
        >
        <div>
          <label htmlFor="purchase-primary" className="font-medium">
            Proveedor principal
          </label>
          <select
            id="purchase-primary"
            value={form.primary}
            onChange={(event) => setForm((current) => ({ ...current, primary: event.target.value }))}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Sin proveedor</option>
            {sortedSuppliers.map((supplier) => (
              <option key={supplier.id} value={String(supplier.id)}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        {sortedSuppliers.length > 0 && (
          <fieldset>
            <legend className="font-medium">Proveedores secundarios</legend>
            <div className="mt-1 space-y-1">
              {sortedSuppliers
                .filter((supplier) => String(supplier.id) !== form.primary)
                .map((supplier) => (
                  <label key={supplier.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.secondary.includes(supplier.id!)}
                      onChange={() => toggleSecondary(supplier.id!)}
                    />
                    {supplier.name}
                  </label>
                ))}
            </div>
          </fieldset>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="purchase-original-price" className="font-medium">
              Precio original
            </label>
            <input
              id="purchase-original-price"
              type="number"
              inputMode="decimal"
              step="any"
              value={form.originalPrice}
              onChange={(event) =>
                setForm((current) => ({ ...current, originalPrice: event.target.value }))
              }
              placeholder="MXN"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label htmlFor="purchase-last-price" className="font-medium">
              Último precio
            </label>
            <input
              id="purchase-last-price"
              type="number"
              inputMode="decimal"
              step="any"
              value={form.lastPrice}
              onChange={(event) => setForm((current) => ({ ...current, lastPrice: event.target.value }))}
              placeholder="MXN"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label htmlFor="purchase-last-date" className="font-medium">
              Fecha de última compra
            </label>
            <input
              id="purchase-last-date"
              type="date"
              value={form.lastDate}
              onChange={(event) => setForm((current) => ({ ...current, lastDate: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label htmlFor="purchase-period" className="font-medium">
              Período
            </label>
            <select
              id="purchase-period"
              value={form.period}
              onChange={(event) => setForm((current) => ({ ...current, period: event.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="purchase-link-url" className="font-medium">
            Nuevo enlace
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="purchase-link-url"
              value={newLinkUrl}
              onChange={(event) => setNewLinkUrl(event.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <button
              type="button"
              onClick={addLink}
              className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-medium transition-all active:scale-95"
            >
              Agregar enlace
            </button>
          </div>
        </div>

        {form.links.length > 0 && (
          <ul className="space-y-1">
            {form.links.map((link, index) => (
              <li key={link.id ?? `new-${index}`} className="flex items-center justify-between gap-2">
                <span className="truncate">{link.url}</span>
                <span className="flex shrink-0 gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-200 px-2.5 py-1 transition-all active:scale-95"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-red-600 transition-all active:scale-95"
                  >
                    Quitar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95"
        >
          Guardar info de compra
        </button>
        </form>
      )}
    </section>
  )
}
