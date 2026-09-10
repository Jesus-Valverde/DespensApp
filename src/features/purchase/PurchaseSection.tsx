import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Period, Product, ProductPurchase, Supplier, SupplierLink } from '../../db/types'
import { savePurchaseInfo, type PurchaseLinkInput } from './api'
import { addMember, removeMember } from '../lists/api'
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
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  open: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3',
  cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  trendDown: 'M3 7l6 6 4-4 8 8 M17 13h4v4',
  trendUp: 'M3 17l6-6 4 4 8-8 M17 11h4V7',
  add: 'M12 5v14 M5 12h14',
  chevron: 'M9 18l6-6-6-6',
  cerrar: 'M6 18L18 6M6 6l12 12',
  check: 'M5 13l4 4L19 7',
  business:
    'M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2 M4 16v6 M8 16v6 M12 16v6 M16 16v6 M20 16v6 M2 16h20 M3 10.5 12 3l9 7.5 M5 9v7 M9 9v7 M11 9v7 M13 9v7 M15 9v7 M19 9v7',
  lista: 'M3 5h.01 M3 12h.01 M3 19h.01 M8 5h13 M8 12h13 M8 19h13',
}

function Glyph({
  d,
  className = 'h-5 w-5',
  strokeWidth = 2,
}: {
  d: string
  className?: string
  strokeWidth?: number
}) {
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

/** Shared modal chrome: overlay + rounded card with a max height. */
function ModalShell({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl">
        {children}
      </div>
    </div>
  )
}

function ModalHeader({
  icon,
  iconClass,
  title,
  subtitle,
  onClose,
}: {
  icon: string
  iconClass: string
  title: string
  subtitle: string
  onClose: () => void
}) {
  return (
    <div className="flex shrink-0 items-start justify-between border-b border-slate-100 pb-3">
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${iconClass}`}>
          <Glyph d={icon} className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-400">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
      >
        <Glyph d={GLYPHS.cerrar} className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Product reference chip shared by the supplier/list modals. */
function ProductChip({ product }: { product: Product }) {
  return (
    <div className="mt-3 flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-2.5 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold leading-tight text-slate-900">{product.title}</p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
          {[product.brand, product.family].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
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

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

/** "Editar información de compra" modal (Stitch design): the purchase form
 * lives behind the card's "Ver todos" action. */
function EditPurchaseModal({
  product,
  suppliers,
  onClose,
}: {
  product: Product
  suppliers: Supplier[]
  onClose: () => void
}) {
  const [form, setForm] = useState<PurchaseFormValue>(() => toFormValue(product.purchase))
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [error, setError] = useState('')

  const sortedSuppliers = [...suppliers].sort((a, b) => a.name.localeCompare(b.name, 'es'))

  function setField(field: keyof PurchaseFormValue, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

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
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar la info de compra')
    }
  }

  return (
    <ModalShell label="Editar información de compra">
      <ModalHeader
        icon={GLYPHS.bag}
        iconClass="border-amber-100 bg-amber-50 text-amber-600"
        title="Editar información de compra"
        subtitle={`Ajusta los precios y detalles de adquisición de ${product.title}`}
        onClose={onClose}
      />

      <form id="purchase-edit-form" onSubmit={handleSubmit} className="flex-1 space-y-3.5 overflow-y-auto py-3">
        <div>
          <label htmlFor="purchase-primary" className="font-medium">
            Proveedor principal
          </label>
          <select
            id="purchase-primary"
            value={form.primary}
            onChange={(event) => setField('primary', event.target.value)}
            className={inputClass}
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
            <label htmlFor="purchase-last-price" className="font-medium">
              Último precio
            </label>
            <input
              id="purchase-last-price"
              type="number"
              inputMode="decimal"
              step="any"
              value={form.lastPrice}
              onChange={(event) => setField('lastPrice', event.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="purchase-original-price" className="font-medium">
              Precio referencia
            </label>
            <input
              id="purchase-original-price"
              type="number"
              inputMode="decimal"
              step="any"
              value={form.originalPrice}
              onChange={(event) => setField('originalPrice', event.target.value)}
              placeholder="0.00"
              className={inputClass}
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
              onChange={(event) => setField('lastDate', event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="purchase-period" className="font-medium">
              Frecuencia de compra
            </label>
            <select
              id="purchase-period"
              value={form.period}
              onChange={(event) => setField('period', event.target.value)}
              className={inputClass}
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
            Enlace web / URL producto <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="purchase-link-url"
              type="url"
              value={newLinkUrl}
              onChange={(event) => setNewLinkUrl(event.target.value)}
              placeholder="https://tienda.com/producto…"
              className={inputClass}
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
      </form>

      <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="purchase-edit-form"
          className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          Guardar cambios
        </button>
      </div>
    </ModalShell>
  )
}

/** "Proveedores del producto" modal (Stitch design): one card per linked
 * supplier. Per-supplier price/frequency/link are not in the schema yet — the
 * card shows the product's own price for the primary supplier only. */
function SuppliersModal({
  product,
  suppliers,
  onEditSupplier,
  onLink,
  onClose,
}: {
  product: Product
  suppliers: Supplier[]
  onEditSupplier: (link: SupplierLink) => void
  onLink: () => void
  onClose: () => void
}) {
  const purchase = product.purchase
  const linkFor = (supplierId: number) =>
    purchase.supplierLinks?.find((link) => link.supplierId === supplierId)
  const cards: { supplier: Supplier; principal: boolean }[] = []
  const primary = suppliers.find((supplier) => supplier.id === purchase.primarySupplierId)
  if (primary) cards.push({ supplier: primary, principal: true })
  for (const id of purchase.secondarySupplierIds) {
    const supplier = suppliers.find((candidate) => candidate.id === id)
    if (supplier) cards.push({ supplier, principal: false })
  }
  const firstLink = purchase.links[0]
  // Rotating tints for secondary supplier icon chips, per the design.
  const SECONDARY_TINTS = [
    'border-emerald-100 bg-emerald-50 text-emerald-600',
    'border-amber-100 bg-amber-50 text-amber-600',
    'border-slate-200 bg-slate-100 text-slate-600',
  ]

  return (
    <ModalShell label="Proveedores del producto">
      <ModalHeader
        icon={GLYPHS.store}
        iconClass="border-amber-100 bg-amber-50 text-amber-600"
        title="Proveedores del producto"
        subtitle="Comparativa de precios y disponibilidad actual"
        onClose={onClose}
      />
      <ProductChip product={product} />

      <div className="space-y-3 overflow-y-auto py-3">
        {cards.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">Sin proveedores vinculados.</p>
        )}
        {cards.map(({ supplier, principal }, index) => {
          const meta = linkFor(supplier.id!)
          const price = meta?.price ?? (principal ? purchase.lastPrice : undefined)
          const url = meta?.url ?? (principal ? firstLink?.url : undefined)
          const frequency = meta?.frequency ?? purchase.period
          return (
            <div
              key={supplier.id}
              className={`flex flex-col gap-2.5 rounded-2xl border p-3.5 ${
                principal ? 'border-blue-100 bg-blue-50/50' : 'border-slate-200/80 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm ${
                      principal
                        ? 'border-blue-200 bg-blue-100 text-blue-600'
                        : SECONDARY_TINTS[index % SECONDARY_TINTS.length]
                    }`}
                  >
                    <Glyph d={GLYPHS.store} className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900">{supplier.name}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          principal
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-200 bg-slate-100 text-slate-600'
                        }`}
                      >
                        {principal ? 'Principal' : 'Secundario'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      Frecuencia: {frequency ? PERIOD_LABEL[frequency] : '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {price != null ? (
                    <>
                      <span className="block text-xs font-black text-slate-900">
                        {formatMoney(price).replace(' MXN', '')}
                      </span>
                      <span className="block text-xs font-semibold text-slate-400">MXN</span>
                    </>
                  ) : (
                    <span className="block text-xs font-black text-slate-300">—</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                  >
                    <Glyph d={GLYPHS.link} className="h-3 w-3" />
                    {url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                  </a>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => onEditSupplier(meta ?? { supplierId: supplier.id! })}
                  className="inline-flex items-center gap-1 font-medium text-slate-600 transition hover:text-blue-600"
                >
                  Editar
                </button>
              </div>
            </div>
          )
        })}

        {suppliers.length > cards.length && (
          <button
            type="button"
            onClick={onLink}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-600 transition active:scale-95 hover:bg-slate-50"
          >
            <Glyph d={GLYPHS.business} className="h-4 w-4 text-slate-400" />
            + Vincular nuevo proveedor
          </button>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          <Glyph d={GLYPHS.check} className="h-3.5 w-3.5" />
          Listo
        </button>
      </div>
    </ModalShell>
  )
}

/** "Vincular nuevo proveedor" modal (Stitch design): rol + per-supplier price,
 * frequency, url and notes. Reused in edit mode by the "Editar" card action. */
function VincularModal({
  product,
  suppliers,
  link,
  onClose,
}: {
  product: Product
  suppliers: Supplier[]
  link?: SupplierLink
  onClose: () => void
}) {
  const purchase = product.purchase
  const editing = link != null
  const available = editing
    ? suppliers
    : suppliers.filter(
        (supplier) =>
          supplier.id !== purchase.primarySupplierId &&
          !purchase.secondarySupplierIds.includes(supplier.id!),
      )
  const supplierName = (id: number) => suppliers.find((supplier) => supplier.id === id)?.name
  const [pickedId, setPickedId] = useState(link ? String(link.supplierId) : '')
  const [rol, setRol] = useState<'principal' | 'secundario'>(
    link && purchase.primarySupplierId === link.supplierId ? 'principal' : 'secundario',
  )
  const [price, setPrice] = useState(link?.price != null ? (link.price / 100).toFixed(2) : '')
  const [frequency, setFrequency] = useState(link?.frequency ?? '')
  const [url, setUrl] = useState(link?.url ?? '')
  const [notes, setNotes] = useState(link?.notes ?? '')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (pickedId === '') {
      setError('Elige un proveedor')
      return
    }
    const picked = Number(pickedId)
    const parsedPrice = price.trim() === '' ? undefined : parseMoney(price)
    if (parsedPrice === null) {
      setError('Ingresa un precio válido')
      return
    }
    const demotedPrimary =
      rol === 'principal' && purchase.primarySupplierId != null && purchase.primarySupplierId !== picked
    const nextLink: SupplierLink = {
      supplierId: picked,
      price: parsedPrice,
      frequency: (frequency || undefined) as Period | undefined,
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
    }
    const supplierLinks = [
      ...(purchase.supplierLinks ?? []).filter((candidate) => candidate.supplierId !== picked),
      nextLink,
    ]
    try {
      await savePurchaseInfo(product.id!, {
        primarySupplierId: rol === 'principal' ? picked : purchase.primarySupplierId,
        secondarySupplierIds:
          rol === 'principal'
            ? [
                ...purchase.secondarySupplierIds.filter((id) => id !== picked),
                ...(demotedPrimary ? [purchase.primarySupplierId!] : []),
              ]
            : [...new Set([...purchase.secondarySupplierIds.filter((id) => id !== picked), picked])],
        originalPrice: purchase.originalPrice,
        lastPrice: purchase.lastPrice,
        lastPurchaseDate: purchase.lastPurchaseDate,
        period: purchase.period,
        links: purchase.links,
        supplierLinks,
      })
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo vincular el proveedor')
    }
  }

  return (
    <ModalShell label={editing ? 'Editar proveedor' : 'Vincular nuevo proveedor'}>
      <ModalHeader
        icon={GLYPHS.business}
        iconClass="border-blue-100 bg-blue-50 text-blue-600"
        title={editing ? 'Editar proveedor' : 'Vincular nuevo proveedor'}
        subtitle={
          editing && link
            ? `Ajusta precio y datos de ${supplierName(link.supplierId) ?? 'este proveedor'}`
            : `Asocia una tienda o comercio a ${product.title}`
        }
        onClose={onClose}
      />
      <ProductChip product={product} />

      <form id="vincular-form" onSubmit={handleSubmit} className="flex-1 space-y-3.5 overflow-y-auto py-3">
        <div>
          <label htmlFor="vincular-proveedor" className="font-medium">
            Seleccionar proveedor
          </label>
          <select
            id="vincular-proveedor"
            value={pickedId}
            onChange={(event) => setPickedId(event.target.value)}
            className={inputClass}
          >
            <option value="">Elegir proveedor registrado…</option>
            {available.map((supplier) => (
              <option key={supplier.id} value={String(supplier.id)}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="vincular-price" className="font-medium">
            Precio referencia
          </label>
          <input
            id="vincular-price"
            type="number"
            inputMode="decimal"
            step="any"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <span className="font-medium">Tipo de relación / Rol</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(['principal', 'secundario'] as const).map((option) => {
              const selected = rol === option
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center justify-center rounded-xl px-1 py-2 text-center text-xs capitalize transition ${
                    selected
                      ? 'border-2 border-blue-600 bg-blue-50/50 font-bold text-blue-700'
                      : 'border border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="vincular-rol"
                    className="sr-only"
                    checked={selected}
                    onChange={() => setRol(option)}
                  />
                  {option}
                </label>
              )
            })}
          </div>
        </div>

        <div>
          <label htmlFor="vincular-frequency" className="font-medium">
            Frecuencia estimada
          </label>
          <select
            id="vincular-frequency"
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
            className={inputClass}
          >
            <option value="">Sin frecuencia</option>
            <option value="semanal">Semanal</option>
            <option value="quincenal">Quincenal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>

        <div>
          <label htmlFor="vincular-url" className="font-medium">
            Enlace web / URL producto <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="vincular-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://tienda.com/producto…"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="vincular-notes" className="font-medium">
            Notas o presentación <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="vincular-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ej. Paquete con 12 piezas, comprar sólo en oferta"
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>

      <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="vincular-form"
          className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          Vincular proveedor
        </button>
      </div>
    </ModalShell>
  )
}

/** "Gestionar listas" modal (Stitch design): checkbox list with item counts;
 * saving applies the membership diff via the lists api. */
function ListsModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const lists = useLiveQuery(() => db.lists.toArray(), []) ?? []
  const [added, setAdded] = useState<number[]>([])
  const [removed, setRemoved] = useState<number[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const baseMembership = (listId: number) =>
    product.id != null && lists.some((list) => list.id === listId && list.productIds.includes(product.id!))
  const isChecked = (listId: number) =>
    added.includes(listId) || (baseMembership(listId) && !removed.includes(listId))

  function toggle(listId: number) {
    if (isChecked(listId)) {
      setAdded((current) => current.filter((id) => id !== listId))
      if (baseMembership(listId)) setRemoved((current) => [...current, listId])
    } else {
      setRemoved((current) => current.filter((id) => id !== listId))
      setAdded((current) => [...current, listId])
    }
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      await Promise.all([
        ...added.map((listId) => addMember(listId, product.id!)),
        ...removed.map((listId) => removeMember(listId, product.id!)),
      ])
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la asignación')
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = lists.filter((list) => isChecked(list.id!)).length

  return (
    <ModalShell label="Gestionar listas">
      <ModalHeader
        icon={GLYPHS.lista}
        iconClass="border-blue-100 bg-blue-50 text-blue-600"
        title="Gestionar listas"
        subtitle="Selecciona las listas en las que deseas incluir este producto"
        onClose={onClose}
      />
      <ProductChip product={product} />

      <div className="mt-3 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tus listas de compra</h4>
        <span className="text-[11px] font-medium text-slate-400">
          {selectedCount} {selectedCount === 1 ? 'seleccionada' : 'seleccionadas'}
        </span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto py-2">
        {lists.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">
            Aún no tienes listas. Créalas desde la pestaña Listas.
          </p>
        )}
        {lists.map((list) => {
          const checked = isChecked(list.id!)
          return (
            <label
              key={list.id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition ${
                checked ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggle(list.id!)}
              />
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                  checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {checked && <Glyph d={GLYPHS.check} className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-blue-600">
                <Glyph d={GLYPHS.cart} className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-slate-900">{list.title}</span>
                <span className="block text-[11px] text-slate-400">
                  {list.productIds.length} {list.productIds.length === 1 ? 'artículo' : 'artículos'}
                </span>
              </span>
              {checked && (
                <span className="shrink-0 rounded-lg bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {list.productIds.length} uds.
                </span>
              )}
            </label>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex shrink-0 items-center gap-2.5 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-2xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
        >
          Guardar asignación
        </button>
      </div>
    </ModalShell>
  )
}

export function PurchaseSection({ product }: { product: Product }) {
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []) ?? []
  const lists = useLiveQuery(() => db.lists.toArray(), []) ?? []
  const [editOpen, setEditOpen] = useState(false)
  const [suppliersOpen, setSuppliersOpen] = useState(false)
  const [vincularLink, setVincularLink] = useState<SupplierLink | null>(null)
  const [vincularOpen, setVincularOpen] = useState(false)
  const [listsOpen, setListsOpen] = useState(false)
  const [pickedListId, setPickedListId] = useState('')
  const [listPickerOpen, setListPickerOpen] = useState(false)
  const [listError, setListError] = useState('')

  const purchase = product.purchase
  const primaryName = suppliers.find((supplier) => supplier.id === purchase.primarySupplierId)?.name
  const trend =
    purchase.lastPrice != null && purchase.originalPrice != null && purchase.originalPrice > 0
      ? Math.round(((purchase.lastPrice - purchase.originalPrice) / purchase.originalPrice) * 100)
      : null
  const firstLink = purchase.links[0]
  const memberships = lists.filter((list) => product.id != null && list.productIds.includes(product.id))
  const others = lists.filter((list) => product.id == null || !list.productIds.includes(product.id))

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
            <Glyph d={GLYPHS.bag} className="h-5 w-5 text-amber-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Información de compra</h4>
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Ver todos
            <Glyph d={GLYPHS.chevron} className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSuppliersOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-left transition hover:bg-slate-100/70"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-blue-600 shadow-sm">
              <Glyph d={GLYPHS.store} className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs font-bold text-slate-900">{primaryName ?? 'Sin proveedor'}</span>
              <span className="block text-[10px] font-medium text-slate-400">Proveedor principal</span>
            </span>
          </span>
          {primaryName && (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              Principal
            </span>
          )}
        </button>

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
            <Glyph d={GLYPHS.bag} className="h-5 w-5 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Listas asignadas (compra)</h4>
          </div>
          <button
            type="button"
            onClick={() => setListsOpen(true)}
            className="flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:underline"
          >
            <Glyph d={GLYPHS.add} className="h-3.5 w-3.5" />
            Gestionar
          </button>
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

      {editOpen && (
        <EditPurchaseModal
          product={product}
          suppliers={suppliers}
          onClose={() => setEditOpen(false)}
        />
      )}
      {suppliersOpen && (
        <SuppliersModal
          product={product}
          suppliers={suppliers}
          onEditSupplier={(link) => {
            setSuppliersOpen(false)
            setVincularLink(link)
            setVincularOpen(true)
          }}
          onLink={() => {
            setSuppliersOpen(false)
            setVincularLink(null)
            setVincularOpen(true)
          }}
          onClose={() => setSuppliersOpen(false)}
        />
      )}
      {vincularOpen && (
        <VincularModal
          product={product}
          suppliers={suppliers}
          link={vincularLink ?? undefined}
          onClose={() => setVincularOpen(false)}
        />
      )}
      {listsOpen && <ListsModal product={product} onClose={() => setListsOpen(false)} />}
    </section>
  )
}
