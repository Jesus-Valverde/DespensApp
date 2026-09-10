import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { CustomProp, Product } from '../../db/types'
import { iconPath, toneClasses } from '../../lib/icons'
import { useObjectUrl } from '../../lib/useObjectUrl'
import { StockSection } from '../inventory/StockSection'
import { MovementModal } from '../inventory/MovementForm'
import { describeMovement } from '../inventory/BitacoraList'
import { getMovements } from '../inventory/api'
import { PurchaseSection } from '../purchase/PurchaseSection'
import { deleteProduct, duplicateProduct, updateProduct } from './api'

// Inline stroke glyphs (24x24) standing in for the design's Material Symbols
// font, which the app does not load.
const GLYPHS = {
  datos: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  tune: 'M6 4v6m0 4v6m6-16v10m0 4v2m6-16v2m0 4v10 M4 10h4 M10 14h4 M16 6h4',
  stock:
    'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z M22 17.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65 M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65',
  historial: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5 M12 7v5l4 2',
  compra:
    'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0',
  tag: 'M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z M7.5 7.5h.01',
  editar: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
  copiar: 'M8 8h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
  eliminar: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  lugar: 'M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0z M12 10h.01',
  cerrar: 'M18 6 6 18 M6 6l12 12',
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

type TabKey = 'datos' | 'stock' | 'compra'

const TAB_STYLES: Record<TabKey, { on: string; off: string; iconOff: string }> = {
  datos: {
    on: 'bg-blue-600 border-2 border-white text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600 ring-offset-2 ring-offset-blue-100',
    off: 'bg-blue-50 border border-blue-100',
    iconOff: 'text-blue-600',
  },
  stock: {
    on: 'bg-emerald-600 border-2 border-white text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-600 ring-offset-2 ring-offset-emerald-100',
    off: 'bg-emerald-50 border border-emerald-100',
    iconOff: 'text-emerald-600',
  },
  compra: {
    on: 'bg-amber-500 border-2 border-white text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-500 ring-offset-2 ring-offset-amber-100',
    off: 'bg-amber-50 border border-amber-100',
    iconOff: 'text-amber-600',
  },
}

const TABS: { key: TabKey; label: string; glyph: string; subtitle: string }[] = [
  { key: 'datos', label: 'Datos', glyph: GLYPHS.tune, subtitle: 'Ficha' },
  { key: 'stock', label: 'Stock', glyph: GLYPHS.stock, subtitle: 'disp.' },
  { key: 'compra', label: 'Compra', glyph: GLYPHS.compra, subtitle: 'Precios' },
]

function CardHeader({ title, glyph }: { title: string; glyph: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
      <Glyph d={glyph} className="h-5 w-5 text-blue-600" />
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h4>
    </div>
  )
}

function KeyValueRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="space-y-3 pt-3">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-4 border-b border-slate-100 py-1 last:border-0"
        >
          <span className="text-sm text-slate-500">{label}</span>
          <span className="text-right text-sm font-semibold text-slate-800">{value}</span>
        </div>
      ))}
    </div>
  )
}

/** Full-width outline-blue button styled like the design's card footer actions. */
function OutlineAction({ glyph, children, to }: { glyph: string; children: ReactNode; to: string }) {
  return (
    <Link
      to={to}
      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-600 px-3 py-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 active:scale-95"
    >
      <Glyph d={glyph} className="h-3.5 w-3.5" />
      {children}
    </Link>
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
  // "Editar propiedades" modal: null = closed; otherwise a working copy of the
  // custom props being edited (saved in one shot via updateProduct).
  const [propsDraft, setPropsDraft] = useState<CustomProp[] | null>(null)
  const [propsError, setPropsError] = useState('')
  const [movementOpen, setMovementOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const lists = useLiveQuery(() => db.lists.toArray(), []) ?? []

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
    try {
      await deleteProduct(current.id!)
      navigate('/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el producto')
    }
  }

  function openPropsModal() {
    setPropsDraft(current.customProps.map((prop) => ({ ...prop })))
    setPropsError('')
  }

  function setPropField(index: number, field: keyof CustomProp) {
    return (event: { target: { value: string } }) =>
      setPropsDraft((draft) =>
        draft?.map((prop, i) => (i === index ? { ...prop, [field]: event.target.value } : prop)) ?? null,
      )
  }

  function removePropRow(index: number) {
    setPropsDraft((draft) => draft?.filter((_, i) => i !== index) ?? null)
  }

  async function handleSaveProps(event: FormEvent) {
    event.preventDefault()
    setPropsError('')
    try {
      // The modal only owns customProps; the rest is passed through untouched.
      await updateProduct(current.id!, {
        title: current.title,
        brand: current.brand,
        contentSize: current.contentSize,
        area: current.area,
        family: current.family,
        model: current.model,
        description: current.description,
        image: current.image,
        iconKey: current.iconKey,
        iconTone: current.iconTone,
        customProps: (propsDraft ?? []).map((prop) => ({ key: prop.key.trim(), value: prop.value.trim() })),
      })
      setPropsDraft(null)
    } catch (err) {
      setPropsError(err instanceof Error ? err.message : 'No se pudieron guardar las propiedades')
    }
  }

  const datos: [string, ReactNode | undefined][] = [
    [
      'Código / ID',
      <span key="id" className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold">
        #{current.id}
      </span>,
    ],
    ['Nombre', current.title || '—'],
    ['Familia', current.family],
    ['Marca', current.brand],
    ['Contenido', current.contentSize],
    [
      'Área asignada',
      current.area && (
        <span className="flex items-center justify-end gap-1">
          <Glyph d={GLYPHS.lugar} className="h-3.5 w-3.5 text-slate-400" />
          {current.area}
        </span>
      ),
    ],
    ['Modelo / Variante', current.model],
    [
      'Descripción',
      current.description ?? (
        <span key="desc-empty" className="font-medium text-slate-400">
          —
        </span>
      ),
    ],
  ]
  const filledDatos = datos.filter((row): row is [string, ReactNode] => Boolean(row[1]))
  const customRows = current.customProps.map((prop) => [prop.key, prop.value] as [string, string])

  const heroButtonClass =
    'inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-2 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95 border border-slate-200'

  return (
    <section className="space-y-5">
      {error && (
        <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="relative flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-sm">
        {imageUrl ? (
          <img src={imageUrl} alt={current.title} className="mb-3 h-24 w-24 rounded-3xl object-cover" />
        ) : (
          <div
            className={`mb-3 flex h-24 w-24 items-center justify-center rounded-3xl shadow-lg shadow-blue-500/25 ${
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
              className="h-12 w-12"
              aria-hidden="true"
            >
              <path d={iconPath(current.iconKey)} />
            </svg>
            {!current.iconKey && <span className="sr-only">Sin imagen</span>}
          </div>
        )}

        {current.family && (
          <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-blue-100/80 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
            <Glyph d={GLYPHS.tag} className="h-3 w-3" />
            {current.family}
          </span>
        )}
        <h1 className="text-2xl font-black leading-snug tracking-tight text-slate-900">{current.title}</h1>
        <p className="mt-1 text-xs font-medium text-slate-400">
          {current.brand && (
            <>
              Marca: <span className="font-semibold text-slate-700">{current.brand}</span> ·{' '}
            </>
          )}
          ID: #{current.id}
        </p>

        <div className="mt-4 grid w-full grid-cols-3 gap-2 border-t border-slate-100 pt-4">
          <Link to={`/products/${current.id}/edit`} className={heroButtonClass}>
            <Glyph d={GLYPHS.editar} className="h-4 w-4 text-slate-500" />
            Editar
          </Link>
          <button type="button" onClick={handleDuplicate} className={heroButtonClass}>
            <Glyph d={GLYPHS.copiar} className="h-4 w-4 text-slate-500" />
            Crear copia
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200/80 bg-red-50 px-2 py-2.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100/70 active:scale-95"
          >
            <Glyph d={GLYPHS.eliminar} className="h-4 w-4 text-red-500" />
            Eliminar
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Secciones</h3>
          <span className="text-[11px] font-medium text-slate-400">Toca para alternar</span>
        </div>
        <nav aria-label="Secciones del producto" className="grid grid-cols-3 gap-2.5">
          {TABS.map((tab) => {
            const active = tab.key === activeTab
            const styles = TAB_STYLES[tab.key]
            const subtitle = tab.key === 'stock' ? `${current.stock.current} disp.` : tab.subtitle
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center justify-center rounded-2xl p-3 transition active:scale-95 ${
                  active ? styles.on : styles.off
                }`}
              >
                <Glyph d={tab.glyph} className={`mb-1 h-6 w-6 ${active ? 'text-white' : styles.iconOff}`} />
                <span
                  className={`text-xs tracking-tight ${active ? 'font-bold text-white' : 'font-semibold text-slate-800'}`}
                >
                  {tab.label}
                </span>
                <span className={`mt-0.5 text-[10px] font-medium ${active ? 'text-white/90' : 'text-slate-400'}`}>
                  {subtitle}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <div className={activeTab === 'datos' ? 'space-y-4' : 'hidden'}>
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <CardHeader title="Datos del producto" glyph={GLYPHS.datos} />
            {filledDatos.length > 0 ? (
              <KeyValueRows rows={filledDatos} />
            ) : (
              <p className="pt-3 text-sm text-slate-500">Sin datos adicionales.</p>
            )}
            <OutlineAction glyph={GLYPHS.editar} to={`/products/${current.id}/edit`}>
              Editar datos
            </OutlineAction>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <CardHeader title="Propiedades personalizadas" glyph={GLYPHS.tune} />
            {customRows.length > 0 && <KeyValueRows rows={customRows} />}
            <button
              type="button"
              onClick={openPropsModal}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-600 px-3 py-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 active:scale-95"
            >
              <Glyph d={GLYPHS.editar} className="h-3.5 w-3.5" />
              Editar propiedades
            </button>
          </div>
        </div>

        <div className={activeTab === 'stock' ? 'space-y-4' : 'hidden'}>
          <StockSection product={current} onRegister={() => setMovementOpen(true)} />
          <RecentMovements productId={current.id!} onSeeAll={() => setHistoryOpen(true)} />
        </div>

        <div className={activeTab === 'compra' ? 'space-y-4' : 'hidden'}>
          <PurchaseSection product={current} />
        </div>
      </div>

      {propsDraft !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editar propiedades"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                  <Glyph d={GLYPHS.tune} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold leading-snug text-slate-800">Editar propiedades</h3>
                  <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500">
                    Personaliza campos adicionales para {current.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setPropsDraft(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <Glyph d={GLYPHS.cerrar} className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-3.5" onSubmit={handleSaveProps}>
              <div className="max-h-[50vh] space-y-2.5 overflow-y-auto pr-0.5">
                {propsDraft.map((prop, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex-1">
                        <label
                          htmlFor={`prop-key-${index}`}
                          className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                        >
                          Nombre de la propiedad
                        </label>
                        <input
                          id={`prop-key-${index}`}
                          type="text"
                          value={prop.key}
                          onChange={setPropField(index, 'key')}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                      <button
                        type="button"
                        title="Eliminar propiedad"
                        aria-label={`Eliminar propiedad ${prop.key || index + 1}`}
                        onClick={() => removePropRow(index)}
                        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-red-200/80 bg-red-50 text-red-500 transition hover:bg-red-100"
                      >
                        <Glyph d={GLYPHS.eliminar} className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <label
                        htmlFor={`prop-value-${index}`}
                        className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                      >
                        Valor
                      </label>
                      <input
                        id={`prop-value-${index}`}
                        type="text"
                        value={prop.value}
                        onChange={setPropField(index, 'value')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setPropsDraft((draft) => [...(draft ?? []), { key: '', value: '' }])
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-600 bg-blue-50/50 px-3 py-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
              >
                <Glyph d={GLYPHS.mas} className="h-4 w-4" />
                Agregar propiedad
              </button>

              {propsError && (
                <p role="alert" className="text-sm text-red-600">
                  {propsError}
                </p>
              )}

              <div className="flex items-center gap-2.5 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => setPropsDraft(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-95"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {movementOpen && <MovementModal product={current} onClose={() => setMovementOpen(false)} />}
      {historyOpen && (
        <HistoryModal productId={current.id!} productTitle={current.title} onClose={() => setHistoryOpen(false)} />
      )}
      {deleteOpen && (
        <DeleteModal
          product={current}
          linkedLists={lists.filter((list) => list.productIds.includes(current.id!)).length}
          linkedSuppliers={
            (current.purchase.primarySupplierId != null ? 1 : 0) +
            current.purchase.secondarySupplierIds.length
          }
          onConfirm={handleDelete}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </section>
  )
}

/** Delete confirmation (Stitch design): centered danger icon, product summary
 * card and a warning with the linked lists/suppliers counts. */
function DeleteModal({
  product,
  linkedLists,
  linkedSuppliers,
  onConfirm,
  onClose,
}: {
  product: Product
  linkedLists: number
  linkedSuppliers: number
  onConfirm: () => void
  onClose: () => void
}) {
  const imageUrl = useObjectUrl(product.image)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setDeleting(true)
    try {
      await onConfirm()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el producto')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Eliminar producto"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-2xl">
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <Glyph d={GLYPHS.cerrar} className="h-4 w-4" />
          </button>
        </div>
        <span className="mx-auto -mt-2 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600">
          <Glyph d={GLYPHS.eliminar} className="h-6 w-6" />
        </span>
        <h3 className="mt-3 text-lg font-bold text-slate-900">¿Eliminar producto?</h3>
        <p className="mt-1.5 text-sm text-slate-500">
          Esta acción no se puede deshacer. Se eliminará del catálogo y de todas tus listas de
          despensa.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
          ) : (
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                product.iconKey ? toneClasses(product.iconTone) : 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d={iconPath(product.iconKey)} />
              </svg>
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{product.title}</p>
            <p className="truncate text-xs text-slate-500">
              {[product.brand, product.family].filter(Boolean).join(' · ') || 'Sin marca'}
            </p>
          </div>
          <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            {product.stock.current} disp.
          </span>
        </div>

        {(linkedLists > 0 || linkedSuppliers > 0) && (
          <p className="mt-3 flex items-start justify-center gap-1.5 rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <Glyph d={GLYPHS.tag} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>
              {[
                linkedLists > 0 &&
                  `También se desvinculará de ${linkedLists} ${linkedLists === 1 ? 'lista activa' : 'listas activas'}`,
                linkedSuppliers > 0 &&
                  `${linkedLists > 0 ? 'y' : 'También se desvinculará de'} ${linkedSuppliers} ${
                    linkedSuppliers === 1 ? 'proveedor asociado' : 'proveedores asociados'
                  }`,
              ]
                .filter(Boolean)
                .join(' ')}
              .
            </span>
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-red-600 px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-red-500/25 transition hover:bg-red-700 active:scale-95"
          >
            <Glyph d={GLYPHS.eliminar} className="h-3.5 w-3.5" />
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

const historyDateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

type HistoryFilter = 'todos' | 'entrada' | 'salida' | 'ajuste'

/** Full movement log modal opened from "Ver todos" (mock historial-modal). */
function HistoryModal({
  productId,
  productTitle,
  onClose,
}: {
  productId: number
  productTitle: string
  onClose: () => void
}) {
  const movements = useLiveQuery(() => getMovements(productId), [productId]) ?? []
  const [filter, setFilter] = useState<HistoryFilter>('todos')
  const visible = filter === 'todos' ? movements : movements.filter((m) => m.type === filter)
  const count = (f: HistoryFilter) => (f === 'todos' ? movements.length : movements.filter((m) => m.type === f).length)

  const filters: { key: HistoryFilter; label: string }[] = [
    { key: 'todos', label: `Todos (${count('todos')})` },
    { key: 'entrada', label: 'Entradas' },
    { key: 'salida', label: 'Salidas' },
    { key: 'ajuste', label: 'Ajustes' },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Historial de movimientos"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 backdrop-blur-sm sm:p-4"
    >
      <section className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex w-full justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        <div className="flex items-start justify-between border-b border-slate-100 px-5 pb-3 pt-1">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
              <Glyph d={GLYPHS.historial} className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight text-slate-900">Historial de movimientos</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Registro de entradas, salidas y ajustes de{' '}
                <span className="font-medium text-slate-700">{productTitle}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          >
            <Glyph d={GLYPHS.cerrar} className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/50 px-5 pb-2 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={
                  filter === f.key
                    ? 'shrink-0 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm'
                    : 'shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50'
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[50vh] space-y-2.5 overflow-y-auto px-5 py-3">
          {visible.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Sin movimientos todavía.</p>
          ) : (
            visible.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                      m.type === 'entrada'
                        ? 'border-emerald-200/80 bg-emerald-50 text-emerald-600'
                        : m.type === 'salida'
                          ? 'border-red-200/80 bg-red-50 text-red-600'
                          : 'border-blue-100 bg-blue-50 text-blue-600'
                    }`}
                  >
                    {m.delta > 0 ? `+${m.delta}` : m.delta === 0 ? '=' : m.delta}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{m.note || describeMovement(m)}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{historyDateFormatter.format(new Date(m.date))}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block rounded-lg border px-2 py-0.5 text-[11px] font-bold ${
                      m.delta > 0
                        ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
                        : m.delta < 0
                          ? 'border-red-200/80 bg-red-50 text-red-600'
                          : 'border-blue-100 bg-blue-50 text-blue-700'
                    }`}
                  >
                    {m.delta > 0 ? `+${m.delta} ud.` : m.delta < 0 ? `${m.delta} ud.` : 'Ajuste'}
                  </span>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-500">{m.resultingQty} disp.</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 bg-white p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </section>
    </div>
  )
}

const recentDateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

/** Compact "Últimos movimientos" card for the Stock tab; the full log opens in
 * the history modal ("Ver todos"). */
function RecentMovements({
  productId,
  onSeeAll,
}: {
  productId: number
  onSeeAll: () => void
}) {
  const movements = useLiveQuery(() => getMovements(productId), [productId]) ?? []
  const latest = movements.slice(0, 3)

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Glyph d={GLYPHS.historial} className="h-5 w-5 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Últimos movimientos
          </h4>
        </div>
        <button type="button" onClick={onSeeAll} className="text-[11px] font-semibold text-blue-600">
          Ver todos
        </button>
      </div>
      {latest.length === 0 ? (
        <p className="pt-1 text-xs text-slate-400">Sin movimientos todavía.</p>
      ) : (
        <div className="space-y-2.5 pt-1">
          {latest.map((movement) => (
            <div
              key={movement.id}
              className="flex items-center justify-between border-b border-slate-50 py-1 text-xs last:border-0"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                    movement.delta >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {movement.delta >= 0 ? '+' : '−'}
                </span>
                <div>
                  <p className="font-semibold text-slate-800">{describeMovement(movement)}</p>
                  <p className="text-[10px] text-slate-400">
                    {recentDateFormatter.format(new Date(movement.date))}
                    {movement.note ? ` · ${movement.note}` : ''}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-slate-700">
                {movement.resultingQty} disp.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
