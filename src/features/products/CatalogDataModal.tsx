import { ChevronRight, FileSpreadsheet, FileUp } from 'lucide-react'

type CatalogDataModalProps = {
  onClose: () => void
  onImport: () => void
  onHelp: () => void
}

const OPTIONS = [
  {
    key: 'import',
    title: 'Importar CSV',
    description: 'Agrega productos desde un archivo .csv',
    Icon: FileUp,
    tile: 'bg-blue-50 text-blue-600',
  },
  {
    key: 'help',
    title: 'Cómo llenar la plantilla',
    description: 'Tutorial para armar tu CSV de importación',
    Icon: FileSpreadsheet,
    tile: 'bg-emerald-50 text-emerald-700',
  },
] as const

/** Catalog data modal: the two catalog-data entries — CSV import and the
 * template tutorial (opened from the header menu). */
export function CatalogDataModal({ onClose, onImport, onHelp }: CatalogDataModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Datos del catálogo"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-start gap-3 p-5">
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

        <div className="space-y-2 px-5 pb-5">
          {OPTIONS.map(({ key, title, description, Icon, tile }) => (
            <button
              key={key}
              type="button"
              onClick={key === 'import' ? onImport : onHelp}
              className="pressable flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 text-left shadow-sm transition hover:border-blue-300"
            >
              <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${tile}`}>
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900">{title}</span>
                <span className="block text-xs text-slate-500">{description}</span>
              </span>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
