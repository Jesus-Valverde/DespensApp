import { useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Product } from '../../db/types'
import { useObjectUrl } from '../../lib/useObjectUrl'
import { stockState } from '../inventory/StockSection'
import { distinctAreas } from '../products/api'

const TONE_CLASSES: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  low: 'bg-amber-50 text-amber-700 border-amber-200/60',
  out: 'bg-red-50 text-red-700 border-red-200/60',
  over: 'bg-amber-50 text-amber-700 border-amber-200/60',
}

/** Product thumbnail card for the pantry list. */
function PantryCard({ product }: { product: Product }) {
  const imageUrl = useObjectUrl(product.image)
  const state = stockState(product.stock)

  return (
    <Link
      to={`/products/${product.id}`}
      className="pressable flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition hover:border-blue-300"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-300">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 4.27 9 5.15" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m3.3 7 8.7 5 8.7-5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{product.title}</p>
        <p className="truncate text-xs text-slate-400">
          {[product.brand, product.family].filter(Boolean).join(' · ') || 'Sin datos'}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[state.tone]}`}>
          {state.label}
        </span>
        <span className="text-xs font-medium text-slate-500">x{product.stock.current}</span>
      </div>
    </Link>
  )
}

/** /despensa — the pantry view: what is in the house right now, with area
 * filters and stock state. The product catalog lives at /productos (Stitch design). */
export function DespensaScreen() {
  const [area, setArea] = useState<string>('Todos')

  const products = (useLiveQuery(() => db.products.toArray(), []) ?? [])
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, 'es'))
  const areas = distinctAreas(products)

  const visible = area === 'Todos' ? products : products.filter((p) => p.area === area)

  return (
    <section>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-slate-900">
            Despensa
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            Control de despensa e inventario
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
            {products.length} Artículos
          </span>
          <Link
            to="/products"
            className="pressable flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Catálogo
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Area filter chips */}
      <div className="no-scrollbar -mx-1 mb-4 mt-4 flex items-center gap-2 overflow-x-auto px-1 pb-3">
        {['Todos', ...areas].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setArea(chip)}
            aria-pressed={area === chip}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs ${
              area === chip
                ? 'bg-blue-600 font-semibold text-white shadow-sm shadow-blue-500/20'
                : 'border border-slate-200/70 bg-white font-medium text-slate-500 hover:border-slate-300'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <ul className="space-y-2.5">
          {visible.map((product) => (
            <li key={product.id}>
              <PantryCard product={product} />
            </li>
          ))}
        </ul>
      ) : products.length === 0 ? (
        // Catalog is empty: friendly empty state (Stitch design)
        <section className="relative mt-2 flex flex-col items-center overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-50 opacity-60 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-indigo-50 opacity-60 blur-2xl" />
          <div className="animate-subtle-float relative mb-5 flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-50 via-indigo-50/60 to-amber-50 shadow-inner">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect fill="#FFFFFF" height="28" rx="7" stroke="#2563EB" strokeWidth="3" width="44" x="14" y="28" />
              <path d="M22 28V20C22 16.134 25.134 13 29 13H43C46.866 13 50 16.134 50 20V28" stroke="#3B82F6" strokeLinecap="round" strokeWidth="3" />
              <line stroke="#DBEAFE" strokeLinecap="round" strokeWidth="2.5" x1="22" x2="50" y1="38" y2="38" />
              <line stroke="#DBEAFE" strokeLinecap="round" strokeWidth="2.5" x1="22" x2="50" y1="46" y2="46" />
              <circle cx="30" cy="24" fill="#F87171" r="5" />
              <path d="M30 19C30 17 32 16 32 16" stroke="#16A34A" strokeLinecap="round" strokeWidth="2" />
              <rect fill="#FBBF24" height="10" rx="2" width="10" x="38" y="18" />
              <path d="M56 18L57.5 21L60.5 22.5L57.5 24L56 27L54.5 24L51.5 22.5L54.5 21L56 18Z" fill="#60A5FA" />
              <circle cx="15" cy="20" fill="#38BDF8" r="2" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-slate-800">Tu despensa está vacía</h2>
          <p className="mb-6 max-w-xs text-sm font-normal leading-relaxed text-slate-500 mx-auto">
            Sin productos todavía. Toca el botón + para agregar el primero.
          </p>
          <Link
            to="/products/new"
            className="pressable flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Añadir a Despensa
          </Link>
        </section>
      ) : (
        <p className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm text-slate-400">
          Sin productos en el área “{area}”.
        </p>
      )}
    </section>
  )
}
