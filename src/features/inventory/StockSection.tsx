import { useState, type FormEvent } from 'react'
import type { Product, ProductStock } from '../../db/types'
import { setStock } from './api'

export type StockTone = 'ok' | 'low' | 'out' | 'over'

/** Pure classification of the current stock against the min/max levels. */
export function stockState(stock: ProductStock): { label: string; tone: StockTone } {
  if (stock.current <= 0) return { label: 'Sin stock', tone: 'out' }
  if (stock.min != null && stock.current <= stock.min) return { label: 'Bajo mínimo', tone: 'low' }
  if (stock.max != null && stock.current > stock.max) return { label: 'Sobre máximo', tone: 'over' }
  return { label: 'En rango', tone: 'ok' }
}

const TONE_CLASSES: Record<StockTone, string> = {
  ok: 'bg-green-100 text-green-700',
  low: 'bg-amber-100 text-amber-700',
  out: 'bg-red-100 text-red-700',
  over: 'bg-amber-100 text-amber-700',
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

export function StockSection({ product }: { product: Product }) {
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
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el stock')
    }
  }

  const state = stockState(product.stock)
  const summaryParts = [
    `Existencias: ${product.stock.current}`,
    `Mínimo: ${product.stock.min ?? '—'}`,
    `Máximo: ${product.stock.max ?? '—'}`,
  ]
  if (product.stock.location) summaryParts.push(product.stock.location)

  return (
    <section aria-label="Stock" className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Stock</h2>

      <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[state.tone]}`}>
          {state.label}
        </span>
        <p className="mt-2">{summaryParts.join(' · ')}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-2 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
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
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
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
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Guardar stock
          </button>
        </div>
      </form>
    </section>
  )
}
