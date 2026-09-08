import { useState, type FormEvent } from 'react'
import type { MovementType } from '../../db/types'
import { registerMovement } from './api'

const TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste', label: 'Ajuste' },
]

const GLYPHS = {
  sync: 'M8 3 5 6v4 M3 5v5h5 M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6-2.2L3 16 M16 21l3-3v-4 M21 19v-5h-5',
  cerrar: 'M18 6 6 18 M6 6l12 12',
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

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'

/** Movement modal (Stitch design): type pills, quantity and note; on success it
 * closes itself via onClose. */
export function MovementModal({ productId, onClose }: { productId: number; onClose: () => void }) {
  const [type, setType] = useState<MovementType>('entrada')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

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
      await registerMovement(productId, { type, qty: Number(qty), note: note.trim() || undefined })
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Glyph d={GLYPHS.sync} className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-bold text-slate-800">Registrar Movimiento</h3>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <Glyph d={GLYPHS.cerrar} className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-700">Tipo de movimiento</span>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((option) => {
                const selected = option.value === type
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center justify-center rounded-xl p-2 text-xs transition ${
                      selected
                        ? 'border-2 border-blue-600 bg-blue-50/50 font-bold text-blue-700'
                        : 'border border-slate-200 bg-white font-medium text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="movement-type"
                      className="sr-only"
                      value={option.value}
                      checked={selected}
                      onChange={() => setType(option.value)}
                    />
                    {option.label}
                  </label>
                )
              })}
            </div>
          </div>
          <div>
            <label htmlFor="movement-qty" className="mb-1 block text-xs font-medium text-slate-700">
              {type === 'ajuste' ? 'Cantidad resultante' : 'Cantidad'}
            </label>
            <input
              id="movement-qty"
              type="number"
              inputMode="numeric"
              min="0"
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              placeholder="1"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="movement-note" className="mb-1 block text-xs font-medium text-slate-700">
              Nota u observación
            </label>
            <input
              id="movement-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ej. Compra semanal de despensa"
              className={inputClass}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
