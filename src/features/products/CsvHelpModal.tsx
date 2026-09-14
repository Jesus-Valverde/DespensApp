import type { ReactNode } from 'react'

const UNITS: [string, string][] = [
  ['L', 'Litros'],
  ['ml', 'Mililitros'],
  ['g', 'Gramos'],
  ['kg', 'Kilogramos'],
  ['pza', 'Piezas'],
  ['paq', 'Paquete'],
]

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <li className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="flex h-5.5 w-5.5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">
          {n}
        </span>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{children}</p>
    </li>
  )
}

/** Tutorial modal (guide block 17): how to fill the catalog CSV template and
 * which units are valid, opened from the Catálogo view. */
export function CsvHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Cómo importar tu catálogo"
    >
      <div className="max-h-[92%] w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-start gap-3 p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-12v4m0 4h.01" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">Cómo importar tu catálogo</h2>
            <p className="text-xs text-slate-500">Llena la plantilla y súbela a Despensa</p>
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

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 pb-2">
          <ol className="space-y-4">
            <Step n="1" title="Descarga la plantilla">
              Usa{' '}
              <a
                href="/plantilla-catalogo.csv"
                download
                className="font-semibold text-blue-600 hover:underline"
              >
                plantilla-catalogo.csv
              </a>
              ; ya trae las columnas en el orden correcto.
            </Step>
            <Step n="2" title="Llena una fila por producto">
              El <strong>Nombre</strong> es obligatorio. <strong>Contenido</strong> es un número y
              la <strong>Unidad</strong> debe ser de la lista. Stock, precio y frecuencia son
              opcionales.
            </Step>
            <Step n="3" title="Sube el archivo">
              Guarda como CSV y súbelo desde el catálogo. Te mostraremos errores por fila antes de
              confirmar.
            </Step>
          </ol>

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              Unidades válidas
            </h3>
            <ul className="space-y-1.5">
              {UNITS.map(([sym, name]) => (
                <li
                  key={sym}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs"
                >
                  <span className="font-bold text-blue-600">{sym}</span>
                  <span className="text-slate-400">—</span>
                  <span className="font-semibold text-slate-800">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <a
            href="/plantilla-catalogo.csv"
            download
            className="pressable flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Descargar plantilla
          </a>
        </div>
      </div>
    </div>
  )
}
