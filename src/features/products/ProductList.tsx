import { useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Product } from '../../db/types'
import { useObjectUrl } from '../../lib/useObjectUrl'
import { iconPath, toneClasses } from '../../lib/icons'
import { CsvHelpModal } from './CsvHelpModal'
import { ImportCsvModal } from './ImportCsvModal'
import { distinctAreas } from './api'

// Deterministic soft tones so catalog rows feel varied like the Stitch design.
const ICON_TONES = [
  'bg-blue-50 text-blue-600',
  'bg-amber-50 text-amber-600',
  'bg-indigo-50 text-indigo-600',
  'bg-orange-50 text-orange-600',
  'bg-emerald-50 text-emerald-600',
  'bg-rose-50 text-rose-500',
  'bg-yellow-50 text-amber-700',
  'bg-sky-50 text-sky-600',
]

/** Deterministic pastel tone for a product title — shared so the same product
 * keeps the same color across Stock, Catálogo and detail (icon continuity). */
export function toneFor(title: string): string {
  let hash = 0
  for (const ch of title) hash = (hash + ch.charCodeAt(0)) % 997
  return ICON_TONES[hash % ICON_TONES.length]
}

function CatalogCard({ product }: { product: Product }) {
  const imageUrl = useObjectUrl(product.image)
  const subtitle = [product.contentSize, product.brand, product.area].filter(Boolean).join(' • ')

  return (
    <article className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm transition-colors hover:border-slate-200">
      <Link to={`/products/${product.id}`} className="flex min-w-0 flex-1 items-center">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" />
        ) : product.iconKey ? (
          <span
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${toneClasses(product.iconTone)}`}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d={iconPath(product.iconKey)} />
            </svg>
          </span>
        ) : (
          <span
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${toneFor(product.title)}`}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 4.27 9 5.15" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m3.3 7 8.7 5 8.7-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
            </svg>
          </span>
        )}
        <span className="ml-3.5 min-w-0 flex-1">
          <span className="block truncate text-base font-semibold leading-tight text-slate-800">
            {product.title}
          </span>
          {subtitle && <span className="mt-1 block truncate text-xs text-slate-500">{subtitle}</span>}
        </span>
      </Link>
      <Link
        to={`/products/${product.id}/edit`}
        aria-label={`Editar ${product.title}`}
        title={`Editar ${product.title}`}
        className="ml-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </Link>
    </article>
  )
}

/** Catalog body: search + product cards, without the screen header. Lives
 * inside the Despensa screen's "Catálogo" view (there is no Productos tab). */
export function CatalogView() {
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('Todos')
  const [helpOpen, setHelpOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const products = useLiveQuery(() => db.products.orderBy('title').toArray(), []) ?? []
  const areas = distinctAreas(products)

  const needle = query.trim().toLowerCase()
  const visible = products
    .filter((p) => area === 'Todos' || p.area === area)
    .filter((p) =>
      needle
        ? [p.title, p.brand, p.family, p.area]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(needle))
        : true,
    )

  return (
    <section>
      <div className="mb-2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="pressable flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
          </svg>
          Importar desde CSV
        </button>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="pressable flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
          Cómo llenar la plantilla
        </button>
      </div>
      {importOpen && <ImportCsvModal onClose={() => setImportOpen(false)} />}
      {helpOpen && <CsvHelpModal onClose={() => setHelpOpen(false)} />}
      <p className="text-[11px] font-semibold text-slate-500">Área</p>
      <div className="no-scrollbar -mx-1 mb-4 flex items-center gap-2 overflow-x-auto px-1 pb-2">
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
      <div className="relative mb-5">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line strokeLinecap="round" x1="21" x2="16.65" y1="21" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar en catálogo..."
          aria-label="Buscar en catálogo"
          className="w-full rounded-xl border border-slate-200/80 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="text-sm font-semibold text-slate-800">Sin productos todavía.</p>
          <p className="mt-1 text-xs text-slate-500">
            Toca el botón + para agregar el primero al catálogo.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm text-slate-500">
          Sin resultados para “{query.trim()}”.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((product) => (
            <li key={product.id}>
              <CatalogCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
