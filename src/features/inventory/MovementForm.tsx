import { useState, type FormEvent } from 'react'
import type { MovementType, Product } from '../../db/types'
import { registerMovement } from './api'

const PATHS = {
  sync: 'M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4',
  cerrar: 'M6 18L18 6M6 6l12 12',
  mas: 'M12 4v16m8-8H4',
  menos: 'M20 12H4',
  igual: 'M4 8h16M4 16h16',
  check: 'M5 13l4 4L19 7',
  calendario: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
}

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

const TYPE_OPTIONS: {
  value: MovementType
  label: string
  hint: string
  glyph: string
  accent: string
  activeClass: string
}[] = [
  {
    value: 'entrada',
    label: 'Entrada',
    hint: 'Compra/Suma',
    glyph: PATHS.mas,
    accent: 'text-emerald-600',
    activeClass: 'bg-white border-emerald-100 text-emerald-700 shadow-sm',
  },
  {
    value: 'salida',
    label: 'Salida',
    hint: 'Consumo',
    glyph: PATHS.menos,
    accent: 'text-rose-500',
    activeClass: 'bg-white border-rose-100 text-rose-600 shadow-sm',
  },
  {
    value: 'ajuste',
    label: 'Ajuste',
    hint: 'Conteo físico',
    glyph: PATHS.igual,
    accent: 'text-blue-500',
    activeClass: 'bg-white border-blue-100 text-blue-600 shadow-sm',
  },
]

const QUICK_NOTES = ['Compra súper', 'Consumo diario', 'Caducado/Merma']

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20'

/** Movement modal (Stitch design): segmented type control, quantity stepper
 * with a live "existencias resultantes" pill, quick reason chips. The date row
 * of the design is skipped — movements are always registered with the current
 * timestamp. */
export function MovementModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [type, setType] = useState<MovementType>('entrada')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const parsedQty = Number(qty) || 0
  const resulting =
    type === 'entrada'
      ? product.stock.current + parsedQty
      : type === 'salida'
        ? product.stock.current - parsedQty
        : parsedQty
  const sign = type === 'entrada' ? '+' : type === 'salida' ? '−' : ''

  function bump(delta: number) {
    setQty((value) => String(Math.max(0, (Number(value) || 0) + delta)))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    // Required at the form level: an empty input coerces to 0, which would
    // append a no-op entry to the append-only log for type "ajuste".
    if (qty.trim() === '') {
      setError('La cantidad es obligatoria')
      return
    }
    try {
      await registerMovement(product.id!, { type, qty: parsedQty, note: note.trim() || undefined })
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar el movimiento')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Registrar movimiento"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-2 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <section className="flex max-h-[92%] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex w-full justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-start justify-between border-b border-slate-100 px-5 pb-3 pt-1">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
              <Glyph d={PATHS.sync} className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div>
              <h2 className="text-lg font-bold leading-tight text-slate-900">Registrar movimiento</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Actualiza las existencias de{' '}
                <span className="font-medium text-slate-700">{product.title}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          >
            <Glyph d={PATHS.cerrar} className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-4 px-5 py-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tipo de movimiento
              </span>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1">
                {TYPE_OPTIONS.map((option) => {
                  const selected = option.value === type
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setType(option.value)}
                      className={`flex flex-col items-center justify-center rounded-xl border border-transparent px-1 py-2 text-xs font-medium text-slate-600 transition hover:bg-white/60 ${
                        selected ? option.activeClass : ''
                      }`}
                    >
                      <span className={`flex items-center gap-1 ${selected ? 'font-bold' : ''}`}>
                        <Glyph d={option.glyph} className={`h-3.5 w-3.5 ${option.accent}`} strokeWidth={2.5} />
                        {option.label}
                      </span>
                      <span className="text-[9px] font-normal text-slate-400">{option.hint}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="movement-qty"
                  className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {type === 'ajuste' ? 'Cantidad a dejar' : 'Cantidad a ingresar'}
                </label>
                <span className="text-xs font-medium text-slate-500">Unidades</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  aria-label="Disminuir cantidad"
                  onClick={() => bump(-1)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-bold text-slate-700 shadow-sm transition active:scale-95 hover:bg-slate-50"
                >
                  −
                </button>
                <div className="flex flex-1 items-baseline justify-center gap-1">
                  {sign && <span className="text-3xl font-black tracking-tight text-slate-900">{sign}</span>}
                  <input
                    id="movement-qty"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={qty}
                    onChange={(event) => setQty(event.target.value)}
                    placeholder="0"
                    className="w-16 border-0 bg-transparent p-0 text-center text-3xl font-black tracking-tight text-slate-900 outline-none placeholder:text-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-400">ud.</span>
                </div>
                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  onClick={() => bump(1)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-md shadow-blue-500/25 transition active:scale-95 hover:bg-blue-700"
                >
                  +
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-2.5 text-xs">
                <span className="text-slate-500">Existencias resultantes:</span>
                <span className="rounded-lg border border-slate-200/80 bg-white px-2 py-0.5 font-semibold text-slate-800">
                  {product.stock.current} <span className="mx-0.5 text-blue-600">➔</span>{' '}
                  <span className={`font-bold ${resulting < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {resulting}
                  </span>{' '}
                  unidades
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="movement-note"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400"
              >
                Motivo o detalle (opcional)
              </label>
              <input
                id="movement-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ej. Compra semanal de despensa, consumo familiar…"
                className={inputClass}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_NOTES.map((quickNote) => {
                  const selected = note === quickNote
                  return (
                    <button
                      key={quickNote}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setNote(selected ? '' : quickNote)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                        selected
                          ? 'border border-blue-200/60 bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {selected && '✓ '}
                      {quickNote}
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-white p-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95"
            >
              <Glyph d={PATHS.check} className="h-4 w-4" strokeWidth={2.5} />
              Guardar
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
