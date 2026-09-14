import { useRef, useState } from 'react'
import { createBackup, downloadBackup, restoreBackup, validateBackup } from '../lib/backup'

const LAST_BACKUP_KEY = 'despensapp:last-backup'

function lastBackupDate(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

function rememberLastBackup(): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())
  } catch {
    // Private mode: the stamp is best-effort.
  }
}

type Phase = 'idle' | 'restoring' | 'done'

/** Data backup modal: export the whole database as a JSON file and restore
 * from one (V1 of the backup flow; Drive upload rides on the same file). */
export function BackupModal({ onClose }: { onClose: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const [lastBackup, setLastBackup] = useState(lastBackupDate())

  async function handleExport() {
    setMessage('')
    const file = await createBackup()
    downloadBackup(file)
    rememberLastBackup()
    setLastBackup(lastBackupDate())
    setMessage('Copia descargada.')
  }

  async function handleRestoreFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target.files?.[0]
    event.target.value = ''
    if (!input) return
    setMessage('')
    try {
      const parsed = validateBackup(JSON.parse(await input.text()))
      setPhase('restoring')
      await restoreBackup(parsed)
      rememberLastBackup()
      setLastBackup(lastBackupDate())
      setPhase('done')
      setMessage('Datos restaurados correctamente.')
    } catch (error) {
      setPhase('idle')
      setMessage(error instanceof Error ? error.message : 'No se pudo restaurar el respaldo')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Respaldo de datos"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-start gap-3 p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6H16a5 5 0 0 1 1 9.9M9 19l3 3m0 0 3-3m-3 3V9" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">Respaldo de datos</h2>
            <p className="text-xs text-slate-500">
              {lastBackup
                ? `Último respaldo: ${new Date(lastBackup).toLocaleString('es-MX')}`
                : 'Nunca has respaldado tus datos'}
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

        <div className="space-y-3 px-5 pb-2 text-xs leading-relaxed text-slate-500">
          <p>
            <strong className="text-slate-800">Exportar</strong> descarga un archivo con todo tu
            catálogo, stock, compras y movimientos.{' '}
            <strong className="text-slate-800">Restaurar</strong> reemplaza los datos actuales con
            el contenido del archivo.
          </p>
          {phase === 'restoring' && (
            <p className="rounded-xl bg-amber-50 p-3 text-amber-700">
              Confirma para reemplazar tus datos actuales. Esta acción no se puede deshacer.
              <button
                type="button"
                onClick={() => {
                  setPhase('done')
                  setMessage('Restauración cancelada.')
                }}
                className="ml-1 font-semibold text-blue-600 hover:underline"
              >
                Cancelar
              </button>
            </p>
          )}
          {message && (
            <p role="status" className="rounded-xl bg-slate-50 p-3 text-slate-700">
              {message}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={phase === 'restoring'}
            className="pressable flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:border-slate-300 disabled:opacity-50"
          >
            Restaurar
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="pressable flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Exportar
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            onChange={handleRestoreFile}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
