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

type Phase = 'idle' | 'picking' | 'restoring' | 'done'

/** Data backup modal: export the whole database as a JSON file and restore
 * from one (V1 of the backup flow; Drive upload rides on the same file).
 * Restaurar opens a drag & drop zone instead of the raw file picker. */
export function BackupModal({ onClose }: { onClose: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [dragOver, setDragOver] = useState(false)
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

  async function handleRestoreFile(file: File | undefined) {
    if (!file) return
    setMessage('')
    try {
      const parsed = validateBackup(JSON.parse(await file.text()))
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
          {phase === 'picking' ? (
            <>
              <label
                htmlFor="backup-file"
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragOver(false)
                  void handleRestoreFile(event.dataTransfer.files?.[0])
                }}
                className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/60'
                    : 'border-slate-300 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                <input
                  ref={fileInput}
                  id="backup-file"
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    void handleRestoreFile(file)
                  }}
                />
                <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white text-blue-600 shadow-xs transition-transform group-hover:scale-105">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-blue-600">
                  Arrastra tu respaldo aquí
                </span>
                <span className="mt-0.5 text-xs text-slate-500">
                  o haz clic para seleccionarlo — archivo .json
                </span>
              </label>
              <p className="rounded-xl bg-amber-50 p-3 text-amber-700">
                Restaurar reemplaza todos tus datos actuales con el contenido del archivo. Esta
                acción no se puede deshacer.
              </p>
            </>
          ) : (
            <p>
              <strong className="text-slate-800">Exportar</strong> descarga un archivo con todo tu
              catálogo, stock, compras y movimientos.{' '}
              <strong className="text-slate-800">Restaurar</strong> reemplaza los datos actuales con
              el contenido del archivo.
            </p>
          )}
          {phase === 'restoring' && (
            <p className="rounded-xl bg-amber-50 p-3 text-amber-700">Restaurando respaldo…</p>
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
            onClick={() => setPhase(phase === 'picking' ? 'idle' : 'picking')}
            disabled={phase === 'restoring'}
            className="pressable flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:border-slate-300 disabled:opacity-50"
          >
            {phase === 'picking' ? 'Cancelar' : 'Restaurar'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="pressable flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  )
}
