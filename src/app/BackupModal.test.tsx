import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackupModal } from './BackupModal'
import { createBackup } from '../lib/backup'
import { db } from '../db/db'
import type { Product } from '../db/types'

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.carts.clear(), db.lists.clear(), db.movements.clear()])
})

async function seedProduct(): Promise<void> {
  await db.products.add({
    title: 'Leche',
    customProps: [],
    stock: { current: 5, min: null, max: null },
    purchase: { secondarySupplierIds: [], period: null, links: [] },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  } as Product)
}

describe('BackupModal restore', () => {
  it('shows the drag & drop zone when Restaurar is clicked, Cancelar returns', async () => {
    const user = userEvent.setup()
    render(<BackupModal onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Restaurar' }))
    expect(await screen.findByText('Arrastra tu respaldo aquí')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('button', { name: 'Restaurar' })).toBeInTheDocument()
    expect(screen.queryByText('Arrastra tu respaldo aquí')).not.toBeInTheDocument()
  })

  it('restores a valid backup file added through the zone', async () => {
    const user = userEvent.setup()
    await seedProduct()
    const envelope = await createBackup()
    await db.products.clear() // simulate the empty device that restores

    render(<BackupModal onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Restaurar' }))
    const input = screen.getByLabelText(/Arrastra tu respaldo/i) as HTMLInputElement
    await user.upload(input, new File([JSON.stringify(envelope)], 'respaldo.json', { type: 'application/json' }))

    expect(await screen.findByText('Datos restaurados correctamente.')).toBeInTheDocument()
    await waitFor(async () => {
      expect(await db.products.count()).toBe(1)
      expect((await db.products.toArray())[0].title).toBe('Leche')
    })
  })

  it('shows an error when the file is not a valid backup', async () => {
    const user = userEvent.setup()
    render(<BackupModal onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Restaurar' }))
    const input = screen.getByLabelText(/Arrastra tu respaldo/i) as HTMLInputElement
    await user.upload(input, new File(['{}'], 'x.json', { type: 'application/json' }))

    expect(
      await screen.findByText('El archivo no es un respaldo de DespensApp válido'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restaurar' })).toBeInTheDocument()
  })
})
