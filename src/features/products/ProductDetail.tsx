import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { iconPath, toneClasses } from '../../lib/icons'
import { useObjectUrl } from '../../lib/useObjectUrl'
import { StockSection } from '../inventory/StockSection'
import { MovementForm } from '../inventory/MovementForm'
import { BitacoraList } from '../inventory/BitacoraList'
import { PurchaseSection } from '../purchase/PurchaseSection'
import { ListsSection } from '../lists/ListsSection'
import { deleteProduct, duplicateProduct } from './api'

// Inline stroke glyphs (24x24) standing in for the design's Material Symbols
// font, which the app does not load.
const GLYPHS = {
  datos: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  stock:
    'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z M22 17.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65 M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65',
  historial: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5 M12 7v5l4 2',
  compra:
    'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12 M9 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z',
  propiedades: 'M3 17l2 2 4-4 M3 7l2 2 4-4 M13 6h8 M13 12h8 M13 18h8',
  tag: 'M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z M7.5 7.5h.01',
  editar: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
  copiar: 'M8 8h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
  eliminar: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  mas: 'M5 12h14 M12 5v14',
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

type TabKey = 'datos' | 'stock' | 'historial' | 'compra'

const TAB_TINTS = {
  blue: { on: 'bg-blue-600 text-white shadow-md shadow-blue-500/30', off: 'bg-blue-50 text-blue-600' },
  emerald: {
    on: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30',
    off: 'bg-emerald-50 text-emerald-600',
  },
  violet: {
    on: 'bg-violet-600 text-white shadow-md shadow-violet-500/30',
    off: 'bg-violet-50 text-violet-600',
  },
  amber: { on: 'bg-amber-500 text-white shadow-md shadow-amber-500/30', off: 'bg-amber-50 text-amber-600' },
} as const

const TABS: { key: TabKey; label: string; glyph: string; tint: keyof typeof TAB_TINTS }[] = [
  { key: 'datos', label: 'Datos', glyph: GLYPHS.datos, tint: 'blue' },
  { key: 'stock', label: 'Stock', glyph: GLYPHS.stock, tint: 'emerald' },
  { key: 'historial', label: 'Historial', glyph: GLYPHS.historial, tint: 'violet' },
  { key: 'compra', label: 'Compra', glyph: GLYPHS.compra, tint: 'amber' },
]

function CardHeader({ title, glyph, chipClass }: { title: string; glyph: string; chipClass: string }) {
  return (
    <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${chipClass}`}>
        <Glyph d={glyph} className="h-4 w-4" />
      </span>
      {title}
    </h2>
  )
}

function KeyValueRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-2">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0"
        >
          <dt className="text-sm text-slate-500">{label}</dt>
          <dd className="text-right text-sm font-semibold text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const productId = Number(id)
  const product = useLiveQuery(() => db.products.get(productId), [productId])
  const imageUrl = useObjectUrl(product?.image)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('datos')

  if (!product) return <p className="mt-4 text-sm text-slate-500">Cargando…</p>

  // Capture the narrowed product so the handlers below keep the non-undefined type.
  const current = product

  async function handleDuplicate() {
    try {
      const newId = await duplicateProduct(current.id!)
      navigate(`/products/${newId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo duplicar el producto')
    }
  }

  async function handleDelete() {
    const message = `¿Eliminar "${current.title}"? Se borrarán su historial de movimientos y sus referencias en carritos y listas.`
    if (!window.confirm(message)) return
    try {
      await deleteProduct(current.id!)
      navigate('/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el producto')
    }
  }

  const datos: [string, string | undefined][] = [
    ['Marca', current.brand],
    ['Contenido', current.contentSize],
    ['Área', current.area],
    ['Familia', current.family],
    ['Modelo', current.model],
  ]
  const filledDatos = datos.filter((row): row is [string, string] => Boolean(row[1]))
  const customRows = current.customProps.map((prop) => [prop.key, prop.value] as [string, string])

  return (
    <section>
      {error && (
        <p role="alert" className="mb-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {imageUrl ? (
            <img src={imageUrl} alt={current.title} className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
          ) : (
            <div
              className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl ${
                current.iconKey ? toneClasses(current.iconTone) : 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10"
                aria-hidden="true"
              >
                <path d={iconPath(current.iconKey)} />
              </svg>
              {!current.iconKey && <span className="sr-only">Sin imagen</span>}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {current.family && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                <Glyph d={GLYPHS.tag} className="h-3 w-3" />
                {current.family}
              </span>
            )}
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">{current.title}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {current.brand ? `Marca: ${current.brand} · ` : ''}ID: #{current.id}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            to={`/products/${current.id}/edit`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all active:scale-95"
          >
            <Glyph d={GLYPHS.editar} className="h-3.5 w-3.5" />
            Editar datos
          </Link>
          <button
            type="button"
            onClick={handleDuplicate}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all active:scale-95"
          >
            <Glyph d={GLYPHS.copiar} className="h-3.5 w-3.5" />
            Crear copia
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 transition-all active:scale-95"
          >
            <Glyph d={GLYPHS.eliminar} className="h-3.5 w-3.5" />
            Eliminar
          </button>
        </div>
      </div>

      <nav aria-label="Secciones del producto" className="mt-4 grid grid-cols-4 gap-2.5">
        {TABS.map((tab) => {
          const active = tab.key === activeTab
          const subtitle =
            tab.key === 'stock'
              ? `${current.stock.current} disp.`
              : tab.key === 'compra'
                ? 'Precios'
                : tab.key === 'historial'
                  ? 'Bitácora'
                  : 'General'
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-1 rounded-2xl border border-slate-100 p-3 text-center transition-all active:scale-95 ${
                active ? TAB_TINTS[tab.tint].on : TAB_TINTS[tab.tint].off
              }`}
            >
              <Glyph d={tab.glyph} />
              <span className="text-xs font-bold">{tab.label}</span>
              <span className={`text-[10px] ${active ? 'text-white/70' : 'opacity-60'}`}>{subtitle}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-2">
        <div className={activeTab === 'datos' ? '' : 'hidden'}>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <CardHeader title="Datos del producto" glyph={GLYPHS.datos} chipClass="bg-blue-50 text-blue-600" />
              <Link
                to={`/products/${current.id}/edit`}
                className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-all active:scale-95"
              >
                Editar
              </Link>
            </div>
            {filledDatos.length > 0 ? (
              <KeyValueRows rows={filledDatos} />
            ) : (
              <p className="mt-3 text-sm text-slate-500">Sin datos adicionales.</p>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <CardHeader title="Propiedades" glyph={GLYPHS.propiedades} chipClass="bg-emerald-50 text-emerald-600" />
            {customRows.length > 0 ? (
              <KeyValueRows rows={customRows} />
            ) : (
              <Link
                to={`/products/${current.id}/edit`}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-3 text-xs font-semibold text-slate-500 transition-all active:scale-95"
              >
                <Glyph d={GLYPHS.mas} className="h-4 w-4" />
                Agregar propiedad
              </Link>
            )}
          </div>

          <ListsSection productId={current.id!} />
        </div>

        <div className={activeTab === 'stock' ? '' : 'hidden'}>
          <StockSection product={current} />
          <MovementForm productId={current.id!} />
        </div>

        <div className={activeTab === 'historial' ? '' : 'hidden'}>
          <BitacoraList productId={current.id!} />
        </div>

        <div className={activeTab === 'compra' ? '' : 'hidden'}>
          <PurchaseSection product={current} />
        </div>
      </div>
    </section>
  )
}
