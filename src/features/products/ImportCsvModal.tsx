import { useRef, useState } from 'react'
import { db } from '../../db/db'
import { createProduct } from './api'
import { setStock } from '../inventory/api'
import { savePurchaseInfo } from '../purchase/api'
import { parseCatalogCsv, type CatalogCsvParse, type ProductDraft } from './importCsv'

/** Same generic name + brand + model = the same product (naming model). */
function productKey(draft: ProductDraft): string {
  return [draft.title, draft.brand ?? '', draft.model ?? ''].join('|').toLowerCase()
}

type Phase = 'pick' | 'preview' | 'importing' | 'done'

/** Catalog CSV import: pick a file → preview valid rows and per-row errors →
 * import. Stock and purchase info are applied after creating each product. */
export function ImportCsvModal({ onClose }: { onClose: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('pick')
  const [parsed, setParsed] = useState<CatalogCsvParse | null>(null)
  const [imported, setImported] = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [errors, setErrors] = useState<CatalogCsvParse['errors']>([])
  const [message, setMessage] = useState('')

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target.files?.[0]
    event.target.value = ''
    if (!input) return
    setMessage('')
    const result = parseCatalogCsv(await input.text())
    if (result.rows.length === 0 && result.errors.length > 0) {
      setParsed(result)
      setPhase('preview')
      return
    }
    setParsed(result)
    setPhase('preview')
  }

  async function handleImport() {
    if (!parsed) return
    setPhase('importing')
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
    setPhase('done')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Importar productos desde CSV"
    >
      <div className="max-h-[92%] w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-start gap-3 p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">Importar productos</h2>
            <p className="text-xs text-slate-500">Desde tu plantilla CSV</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={phase === 'importing'}
            className="pressable flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[55vh] space-y-3 overflow-y-auto px-5 pb-2">
          {phase === 'pick' && (
            <>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="pressable flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
                <span className="text-sm font-semibold">Elegir archivo CSV</span>
                <span className="text-xs">plantilla-catalogo.csv</span>
              </button>
              {message && <p role="alert" className="text-xs text-red-600">{message}</p>}
            </>
          )}

          {phase === 'preview' && parsed && (
            <>
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
            </>
          )}

          {phase === 'importing' && (
            <p className="text-sm text-slate-600">Importando productos…</p>
          )}

          {phase === 'done' && (
            <>
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
            </>
          )}
        </div>

        <div className="flex gap-2 border-t border-slate-100 p-4">
          {phase === 'preview' && parsed && (
            <>
              <button
                type="button"
                onClick={onClose}
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
            </>
          )}
          {phase === 'pick' && (
            <button
              type="button"
              onClick={onClose}
              className="pressable w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:border-slate-300"
            >
              Cancelar
            </button>
          )}
          {phase === 'done' && (
            <button
              type="button"
              onClick={onClose}
              className="pressable w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Listo
            </button>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    </div>
  )
}
