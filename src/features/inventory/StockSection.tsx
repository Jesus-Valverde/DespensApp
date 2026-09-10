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

const PATHS = {
  place:
    'M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0z M12 10h.01',
  edit: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  tune: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  cerrar: 'M6 18L18 6M6 6l12 12',
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

interface StockFormValue {
  min: string
  max: string
  alerts: boolean
}

function toFormValue(stock: ProductStock): StockFormValue {
  return {
    min: stock.min == null ? '' : String(stock.min),
    max: stock.max == null ? '' : String(stock.max),
    alerts: stock.alerts ?? false,
  }
}

/** Levels editor modal (Stitch design): min/max with steppers plus alerts switch.
 * The current quantity is not edited here — that's what movements are for. */
function LevelsModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [form, setForm] = useState<StockFormValue>(() => toFormValue(product.stock))
  const [error, setError] = useState('')

  function setField(field: 'min' | 'max') {
    return (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  function bump(field: 'min' | 'max', delta: number) {
    setForm((current) => ({
      ...current,
      [field]: String(Math.max(0, (Number(current[field]) || 0) + delta)),
    }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await setStock(product.id!, {
        current: product.stock.current, // untouched: adjust stock via movements
        min: form.min.trim() === '' ? null : Number(form.min),
        max: form.max.trim() === '' ? null : Number(form.max),
        location: product.stock.location,
        alerts: form.alerts,
      })
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el stock')
    }
  }

  function Stepper({
    field,
    id,
    label,
    badge,
    badgeClass,
    hint,
    chip,
  }: {
    field: 'min' | 'max'
    id: string
    label: string
    badge: string
    badgeClass: string
    hint: string
    chip: string
  }) {
    return (
      <div className="space-y-2.5 rounded-2xl border border-slate-200/70 bg-slate-50/90 p-3.5">
        <div>
          <label
            htmlFor={id}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            {label}
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>{badge}</span>
          </label>
          <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              aria-label={`Disminuir stock ${label.toLowerCase().replace('stock ', '')}`}
              onClick={() => bump(field, -1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700 transition-all active:scale-95 hover:bg-slate-200"
            >
              −
            </button>
            <input
              id={id}
              type="number"
              min="0"
              value={form[field]}
              onChange={setField(field)}
              className="w-12 border-0 p-0 text-center text-base font-extrabold text-slate-900 focus:outline-none"
            />
            <button
              type="button"
              aria-label={`Aumentar stock ${label.toLowerCase().replace('stock ', '')}`}
              onClick={() => bump(field, 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700 transition-all active:scale-95 hover:bg-slate-200"
            >
              +
            </button>
          </div>
          <span className="text-right text-xs font-medium text-slate-600">{chip}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Editar niveles de stock"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4"
    >
      <div className="max-h-full w-full max-w-sm overflow-y-auto rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="relative flex items-start justify-between border-b border-slate-100 px-5 pb-3 pt-5">
          <div className="flex items-start space-x-3">
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100/70 bg-blue-50 text-blue-600">
              <Glyph d={PATHS.tune} className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-lg font-bold leading-tight text-slate-900">Editar niveles de stock</h3>
              <p className="mt-1 text-xs font-normal text-slate-500">
                Configura alertas y límites para{' '}
                <span className="font-medium text-slate-700">{product.title}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100/80 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
          >
            <Glyph d={PATHS.cerrar} className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 p-5">
          <Stepper
            field="min"
            id="stock-min"
            label="Stock Mínimo"
            badge="Alerta reposición"
            badgeClass="bg-amber-100 text-amber-800"
            hint="Notificar cuando queden pocas existencias"
            chip={`Alerta ≤ ${Number(form.min) || 0} uds.`}
          />
          <Stepper
            field="max"
            id="stock-max"
            label="Stock Máximo"
            badge="Capacidad sugerida"
            badgeClass="bg-blue-100 text-blue-800"
            hint="Límite ideal para evitar sobrecompra o caducidad"
            chip={`Capacidad: ${Number(form.max) || 0} uds.`}
          />

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Glyph d={PATHS.bell} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-800">Recibir alertas</p>
                <p className="text-[11px] text-slate-500">Avisame cuando esté bajo mínimo</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.alerts}
              aria-label="Recibir alertas"
              onClick={() => setForm((current) => ({ ...current, alerts: !current.alerts }))}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.alerts ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.alerts ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
          </div>

          <p className="px-1 text-center text-[11px] text-slate-400">
            Los cambios afectan el cálculo del estado de inventario en tiempo real.
          </p>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold tracking-wide text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-xs font-semibold tracking-wide text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-95"
            >
              Guardar niveles
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Stock card (Stitch design): status + reminder pills, location, big current
 * number with min/max, the levels editor modal and the register-movement pill. */
export function StockSection({
  product,
  onRegister,
}: {
  product: Product
  onRegister: () => void
}) {
  const [levelsOpen, setLevelsOpen] = useState(false)
  const state = stockState(product.stock)
  const tone = PILL_CLASSES[state.tone]
  // Reminder reflects the alerts switch (new source of truth); old products
  // without alerts fall back to the purchase period from the Compra tab.
  const reminder = product.stock.alerts ?? (product.purchase.period != null)

  return (
    <section
      aria-label="Stock"
      className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
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
          <Glyph d={PATHS.bell} className="h-3 w-3" />
          {reminder ? 'Recordatorio activo' : 'Sin recordatorio'}
        </span>
      </div>
      {product.stock.location && (
        <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
          <Glyph d={PATHS.place} className="h-3.5 w-3.5 text-slate-400" />
          {product.stock.location}
        </p>
      )}

      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Existencias actuales</span>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setLevelsOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <Glyph d={PATHS.edit} className="h-3 w-3" />
            Editar niveles
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
        <Glyph d={PATHS.edit} className="h-4 w-4" />
        Registrar movimiento
      </button>

      {levelsOpen && <LevelsModal product={product} onClose={() => setLevelsOpen(false)} />}
    </section>
  )
}
