import { useState, type FormEvent } from 'react'
import type { MovementType } from '../../db/types'
import { registerMovement } from './api'

const TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste', label: 'Ajuste' },
]

export function MovementForm({ productId }: { productId: number }) {
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
      setQty('')
      setNote('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar el movimiento')
    }
  }

  return (
    <section aria-label="Movimientos" className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Movimientos</h2>

      <form onSubmit={handleSubmit} className="mt-2 space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div>
          <label htmlFor="movement-type" className="font-medium">
            Tipo de movimiento
          </label>
          <select
            id="movement-type"
            value={type}
            onChange={(event) => setType(event.target.value as MovementType)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="movement-qty" className="font-medium">
            {type === 'ajuste' ? 'Cantidad resultante' : 'Cantidad'}
          </label>
          <input
            id="movement-qty"
            type="number"
            inputMode="numeric"
            min="0"
            value={qty}
            onChange={(event) => setQty(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="movement-note" className="font-medium">
            Nota
          </label>
          <input
            id="movement-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Opcional"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Registrar
        </button>
      </form>
    </section>
  )
}
