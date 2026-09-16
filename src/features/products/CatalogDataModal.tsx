import { Database, FileUp } from 'lucide-react'

const UNITS: [string, string][] = [
  ['L', 'Litros'],
  ['ml', 'Mililitros'],
  ['g', 'Gramos'],
  ['kg', 'Kilogramos'],
  ['pza', 'Piezas'],
  ['paq', 'Paquete'],
]

/** Catalog data modal: the CSV import entry plus inline template help
 * (Respaldo-style body info instead of a separate tutorial modal). */
export function CatalogDataModal({ onClose, onImport }: { onClose: () => void; onImport: () => void }) {
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

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 pb-2 text-xs leading-relaxed text-slate-500">
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
            onClick={onImport}
            className="pressable flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <FileUp className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Importar CSV
          </button>
        </div>
      </div>
    </div>
  )
}
