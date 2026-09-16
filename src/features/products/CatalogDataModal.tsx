import { useRef, useState } from 'react'
import { Database, FileUp } from 'lucide-react'
import { db } from '../../db/db'
import { createProduct } from './api'
import { setStock } from '../inventory/api'
import { savePurchaseInfo } from '../purchase/api'
import { parseCatalogCsv, type CatalogCsvParse, type ProductDraft } from './importCsv'

const UNITS: [string, string][] = [
  ['L', 'Litros'],
  ['ml', 'Mililitros'],
  ['g', 'Gramos'],
  ['kg', 'Kilogramos'],
  ['pza', 'Piezas'],
  ['paq', 'Paquete'],
]

/** Same generic name + brand + model = the same product (naming model). */
function productKey(draft: ProductDraft): string {
  return [draft.title, draft.brand ?? '', draft.model ?? ''].join('|').toLowerCase()
}

type ImportPhase = 'closed' | 'picking' | 'preview' | 'importing' | 'done'

/** Catalog data modal: template help as plain body text (Respaldo-modal
 * style) and the CSV import flow inline — "Importar CSV" unfolds the
 * drag & drop zone right below the button instead of opening another modal. */
export function CatalogDataModal({ onClose }: { onClose: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [importPhase, setImportPhase] = useState<ImportPhase>('closed')
  const [dragOver, setDragOver] = useState(false)
  const [parsed, setParsed] = useState<CatalogCsvParse | null>(null)
  const [imported, setImported] = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [errors, setErrors] = useState<CatalogCsvParse['errors']>([])

  function closeImport() {
    setImportPhase('closed')
    setParsed(null)
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setParsed(parseCatalogCsv(await file.text()))
    setImportPhase('preview')
  }

  async function handleImport() {
    if (!parsed) return
    setImportPhase('importing')
    const rowErrors: CatalogCsvParse['errors'] = []
    let count = 0
    let skipped = 0
    const existing = new Set(
      (await db.products.toArray()).map((p) =>
        [p.title, p.brand ?? '', p.model ?? ''].join('|').toLowerCase(),
      ),
    )
    for (const [index, draft] of parsed.rows.entries()) {
      const key = productKey(draft)
      if (existing.has(key)) {
        skipped += 1
        continue
      }
      try {
        const { stock, purchase, ...datos } = draft
        const id = await createProduct({ ...datos, customProps: [] })
        const hasStock =
          stock.current !== 0 || stock.min != null || stock.max != null || stock.location
        if (hasStock) await setStock(id, stock)
        if (purchase.period || purchase.originalPrice) {
          await savePurchaseInfo(id, {
            period: purchase.period,
            secondarySupplierIds: [],
            links: [],
            originalPrice: purchase.originalPrice,
          })
        }
        existing.add(key)
        count += 1
      } catch (error) {
        rowErrors.push({ row: index + 2, message: error instanceof Error ? error.message : 'error desconocido' })
      }
    }
    setImported(count)
    setSkipped(skipped)
    setErrors(rowErrors)
    setImportPhase('done')
  }

  const importActive = importPhase !== 'closed'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Datos del catálogo"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-start gap-3 p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
            <Database className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">Datos del catálogo</h2>
            <p className="text-xs text-slate-500">
              Importa productos o consulta la ayuda de la plantilla.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="pressable flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 pb-2 text-xs leading-relaxed text-slate-500">
          <p>
            <strong className="text-slate-800">Cómo llenar la plantilla:</strong> descarga{' '}
            <a
              href="/plantilla-catalogo.csv"
              download
              className="font-semibold text-blue-600 hover:underline"
            >
              plantilla-catalogo.csv
            </a>{' '}
            — ya trae las columnas en el orden correcto — y llena una fila por producto:{' '}
            <strong className="text-slate-800">Nombre</strong> obligatorio,{' '}
            <strong className="text-slate-800">Contenido</strong> numérico y{' '}
            <strong className="text-slate-800">Unidad</strong> de la lista; stock, precio y
            frecuencia son opcionales. Guarda como CSV y te mostraremos errores por fila antes de
            confirmar.
          </p>
          <p>
            <strong className="text-slate-800">Unidades válidas:</strong>{' '}
            {UNITS.map(([sym, name], index) => (
              <span key={sym}>
                {index > 0 && ', '}
                <span className="font-bold text-blue-600">{sym}</span>{' '}
                <span className="text-slate-400">({name})</span>
              </span>
            ))}
            .
          </p>
        </div>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={() => (importActive ? closeImport() : setImportPhase('picking'))}
            disabled={importPhase === 'importing'}
            className={`pressable w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50 ${
              importActive
                ? 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {importActive ? 'Cancelar' : 'Importar CSV'}
          </button>

          {importPhase === 'picking' && (
            <div className="mt-3 space-y-2">
              <label
                htmlFor="catalog-csv"
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragOver(false)
                  void handleFile(event.dataTransfer.files?.[0])
                }}
                className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/60'
                    : 'border-slate-300 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                <input
                  ref={fileInput}
                  id="catalog-csv"
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    void handleFile(file)
                  }}
                />
                <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white text-blue-600 shadow-xs transition-transform group-hover:scale-105">
                  <FileUp className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-blue-600">
                  Agrega o arrastra tu archivo CSV
                </span>
                <span className="mt-0.5 text-xs text-slate-500">
                  o haz clic para seleccionarlo — plantilla-catalogo.csv
                </span>
              </label>
            </div>
          )}

          {importPhase === 'preview' && parsed && (
            <div className="mt-3 space-y-2">
              {parsed.rows.length > 0 ? (
                <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                  {parsed.rows.length === 1
                    ? '1 producto listo para importar'
                    : `${parsed.rows.length} productos listos para importar`}
                </p>
              ) : (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  No se encontró ninguna fila válida.
                </p>
              )}
              {parsed.errors.length > 0 && (
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs font-bold text-amber-700">
                    {parsed.errors.length === 1 ? '1 fila con errores' : `${parsed.errors.length} filas con errores`}
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-amber-700">
                    {parsed.errors.slice(0, 10).map((error) => (
                      <li key={error.row}>
                        Fila {error.row}: {error.message}
                      </li>
                    ))}
                    {parsed.errors.length > 10 && (
                      <li>y {parsed.errors.length - 10} más…</li>
                    )}
                  </ul>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Los productos con el mismo nombre ya existentes se omiten.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeImport}
                  className="pressable flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:border-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={parsed.rows.length === 0}
                  className="pressable flex-[1.4] rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {parsed.rows.length === 1 ? 'Importar producto' : `Importar ${parsed.rows.length} productos`}
                </button>
              </div>
            </div>
          )}

          {importPhase === 'importing' && (
            <p className="mt-3 text-sm text-slate-600">Importando productos…</p>
          )}

          {importPhase === 'done' && (
            <div className="mt-3 space-y-2">
              <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                {imported === 1 ? 'Se importó 1 producto.' : `Se importaron ${imported} productos.`}
                {skipped > 0 && (
                  <span className="font-normal">
                    {' '}
                    {skipped === 1 ? '(1 omitido por duplicado)' : `(${skipped} omitidos por duplicado)`}
                  </span>
                )}
              </p>
              {errors.length > 0 && (
                <ul className="space-y-1 text-xs text-red-600">
                  {errors.map((error, i) => (
                    <li key={i}>Fila {error.row}: {error.message}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={closeImport}
                className="pressable w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
