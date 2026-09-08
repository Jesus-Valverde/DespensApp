import { useState, type FormEvent } from 'react'
import type { Product, ProductStock } from '../../db/types'
import { setStock } from './api'

export type StockTone = 'ok' | 'low' | 'out' | 'over'

/** Pure classification of the current stock against the min/max levels. */
export function stockState(stock: ProductStock): { label: string; tone: StockTone } {
  if (stock.current <= 0) return { label: 'Sin stock', tone: 'out' }
  if (stock.min != null && stock.current <= stock.min) return { label: 'Bajo mínimo', tone: 'low' }
  if (stock.max != null && stock.current > stock.max) return { label: 'Sobre máximo', tone: 'over' }
  return { label: 'En inventario', tone: 'ok' }
}

const PILL_CLASSES: Record<StockTone, { pill: string; dot: string }> = {
  ok: { pill: 'border-emerald-200/80 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  low: { pill: 'border-amber-200/80 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  out: { pill: 'border-red-200/80 bg-red-50 text-red-700', dot: 'bg-red-500' },
  over: { pill: 'border-amber-200/80 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
}

const PLACE_PATH =
  'M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0z M12 10h.01'

const EDIT_PATH = 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'

const BELL_PATH =
  'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'

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

interface StockFormValue {
  current: string
  min: string
  max: string
  location: string
}

function toFormValue(stock: ProductStock): StockFormValue {
  return {
    current: String(stock.current),
    min: stock.min == null ? '' : String(stock.min),
    max: stock.max == null ? '' : String(stock.max),
    location: stock.location ?? '',
  }
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

/** Stock card (Stitch design): status pill + location, big current number with
 * min/max, a collapsible "Editar niveles" form and the register-movement pill. */
export function StockSection({
  product,
  onRegister,
}: {
  product: Product
  onRegister: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<StockFormValue>(() => toFormValue(product.stock))
  const [error, setError] = useState('')

  function setField(field: keyof StockFormValue) {
    return (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await setStock(product.id!, {
        current: Number(form.current),
        min: form.min.trim() === '' ? null : Number(form.min),
        max: form.max.trim() === '' ? null : Number(form.max),
        location: form.location,
      })
      setEditing(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el stock')
    }
  }

  const state = stockState(product.stock)
  const tone = PILL_CLASSES[state.tone]
  // Reminder status rides on the purchase period configured in the Compra tab.
  const reminder = product.purchase.period != null

  return (
    <section
      aria-label="Stock"
      className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tone.pill}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${tone.dot}`} />
            {state.label}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              reminder
                ? 'border-blue-200/80 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            <Glyph d={BELL_PATH} className="h-3 w-3" />
            {reminder ? 'Recordatorio activo' : 'Sin recordatorio'}
          </span>
        </div>
        {product.stock.location && (
          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            >
              {PLACE_PATH.split(' M').map((segment, index) => (
                <path key={index} d={index === 0 ? segment : `M${segment}`} />
              ))}
            </svg>
            {product.stock.location}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Existencias actuales</span>
          <button
            type="button"
            aria-expanded={editing}
            onClick={() => setEditing((value) => !value)}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <Glyph d={EDIT_PATH} className="h-3 w-3" />
            {editing ? 'Cerrar niveles' : 'Editar niveles'}
          </button>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">{product.stock.current}</span>
            <span className="text-sm font-semibold text-slate-500">unidades</span>
          </div>
          <div className="space-y-0.5 text-right text-xs text-slate-500">
            <div>
              Mínimo: <span className="font-bold text-slate-800">{product.stock.min ?? '—'}</span>
            </div>
            <div>
              Máximo: <span className="font-bold text-slate-800">{product.stock.max ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRegister}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-blue-600 px-4 py-3 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50/50 active:scale-95"
      >
        <Glyph d={EDIT_PATH} className="h-4 w-4" />
        Registrar movimiento
      </button>

      {editing && (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
          <div>
            <label htmlFor="stock-current" className="font-medium">
              Actual
            </label>
            <input
              id="stock-current"
              type="number"
              inputMode="numeric"
              min="0"
              value={form.current}
              onChange={setField('current')}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="stock-location" className="font-medium">
              Ubicación
            </label>
            <input
              id="stock-location"
              value={form.location}
              onChange={setField('location')}
              placeholder="refri, alacena…"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="stock-min" className="font-medium">
              Mínimo
            </label>
            <input
              id="stock-min"
              type="number"
              inputMode="numeric"
              min="0"
              value={form.min}
              onChange={setField('min')}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="stock-max" className="font-medium">
              Máximo
            </label>
            <input
              id="stock-max"
              type="number"
              inputMode="numeric"
              min="0"
              value={form.max}
              onChange={setField('max')}
              className={inputClass}
            />
          </div>
          {error && (
            <p role="alert" className="col-span-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="col-span-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/30 transition-all hover:bg-blue-700 active:scale-95"
            >
              Guardar stock
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
