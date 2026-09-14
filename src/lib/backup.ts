import 'dexie-export-import'
import { db } from '../db/db'

const BACKUP_APP = 'despensapp'
const BACKUP_FORMAT = 1

export interface BackupEnvelope {
  app: 'despensapp'
  format: number
  createdAt: string
  /** Dexie export (dexie-export-import format): schema + all rows, images as base64. */
  payload: unknown
}

/** Serializes the whole database into a portable JSON snapshot. Uses the
 * official Dexie export so Blobs (product images) survive and schema versions
 * are handled. */
export async function createBackup(): Promise<BackupEnvelope> {
  const payload = await db.export()
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    createdAt: new Date().toISOString(),
    payload: JSON.parse(await payload.text()),
  }
}

/** Validates shape and version. Throws Spanish messages for the UI. */
export function validateBackup(parsed: unknown): BackupEnvelope {
  const file = parsed as BackupEnvelope
  const tables = (file?.payload as { data?: { tables?: unknown } })?.data?.tables
  if (
    !file ||
    typeof file !== 'object' ||
    file.app !== BACKUP_APP ||
    typeof file.format !== 'number' ||
    !Array.isArray(tables)
  ) {
    throw new Error('El archivo no es un respaldo de DespensApp válido')
  }
  if (file.format > BACKUP_FORMAT) {
    throw new Error('El respaldo fue creado con una versión más reciente de la app')
  }
  return file
}

/** Replaces ALL current data with the backup contents. */
export async function restoreBackup(file: BackupEnvelope): Promise<void> {
  const blob = new Blob([JSON.stringify(file.payload)], { type: 'application/json' })
  await db.transaction(
    'rw',
    [db.products, db.suppliers, db.carts, db.lists, db.movements],
    async () => {
      await Promise.all([
        db.products.clear(),
        db.suppliers.clear(),
        db.carts.clear(),
        db.lists.clear(),
        db.movements.clear(),
      ])
    },
  )
  await db.import(blob)
}

export function backupFileName(createdAt: string): string {
  return `despensapp-backup-${createdAt.slice(0, 10)}.json`
}

export function downloadBackup(file: BackupEnvelope): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = backupFileName(file.createdAt)
  anchor.click()
  URL.revokeObjectURL(url)
}
