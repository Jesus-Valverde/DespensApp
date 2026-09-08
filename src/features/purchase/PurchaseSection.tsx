import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Period, Product, ProductPurchase, Supplier } from '../../db/types'
import { savePurchaseInfo, type PurchaseLinkInput } from './api'
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
  const [form, setForm] = useState<PurchaseFormValue>(() => toFormValue(product.purchase))
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [error, setError] = useState('')

  const sortedSuppliers = [...suppliers].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const supplierName = (id: number | undefined) =>
    id == null ? undefined : sortedSuppliers.find((supplier: Supplier) => supplier.id === id)?.name

  const purchase = product.purchase
  const summary: [string, string | undefined][] = [
    ['Proveedor', supplierName(purchase.primarySupplierId)],
    ['Precio original', purchase.originalPrice != null ? formatMoney(purchase.originalPrice) : undefined],
    ['Último precio', purchase.lastPrice != null ? formatMoney(purchase.lastPrice) : undefined],
    ['Última compra', purchase.lastPurchaseDate ? formatDate(purchase.lastPurchaseDate) : undefined],
    ['Período', purchase.period ? PERIOD_LABEL[purchase.period] : undefined],
    ['Próxima compra', purchase.nextPurchaseDate ? formatDate(purchase.nextPurchaseDate) : undefined],
  ]
  const filledSummary = summary.filter(([, value]) => value)

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

  return (
    <section aria-label="Info de compra" className="mt-6">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Info de compra</h2>

      <div className="mt-2 rounded-2xl border border-slate-100 bg-white p-5 text-sm shadow-sm">
        {filledSummary.length > 0 ? (
          <dl>
            {filledSummary.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-0.5">
                <dt className="text-slate-500">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-slate-500">Sin información de compra.</p>
        )}
      </div>

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
    </section>
  )
}
