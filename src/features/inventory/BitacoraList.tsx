import { useLiveQuery } from 'dexie-react-hooks'
import type { Movement, MovementType } from '../../db/types'
import { getMovements } from './api'

const TYPE_LABEL: Record<MovementType, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
}

const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

/** Human description of a log entry, e.g. "Entrada +6 → 10". */
export function describeMovement(movement: Movement): string {
  const delta = movement.delta > 0 ? `+${movement.delta}` : String(movement.delta)
  return `${TYPE_LABEL[movement.type]} ${delta} → ${movement.resultingQty}`
}

/** Append-only movement log (bitácora), newest first, with no edit/delete controls. */
export function BitacoraList({ productId }: { productId: number }) {
  const movements = useLiveQuery(() => getMovements(productId), [productId]) ?? []

  return (
    <section aria-label="Bitácora" className="mt-6">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Bitácora</h2>

      {movements.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Sin movimientos todavía.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {movements.map((movement) => (
            <li
              key={movement.id}
              className="rounded-xl border border-slate-100 bg-white p-3.5 text-sm shadow-sm"
            >
              <p className="font-medium">{describeMovement(movement)}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {dateFormatter.format(new Date(movement.date))}
                {movement.note ? ` · ${movement.note}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
