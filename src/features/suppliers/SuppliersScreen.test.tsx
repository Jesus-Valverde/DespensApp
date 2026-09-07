import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SuppliersScreen } from './SuppliersScreen'
import { db } from '../../db/db'
import { createSupplier } from './api'
import type { Product } from '../../db/types'

beforeEach(async () => {
  await db.suppliers.clear()
  await db.products.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function makeProduct(title: string, supplierId: number): Product {
  return {
    title,
    customProps: [],
    stock: { current: 0, min: null, max: null },
    purchase: { primarySupplierId: supplierId, secondarySupplierIds: [], links: [], period: null },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  }
}

describe('SuppliersScreen', () => {
  it('rejects an empty name with the Spanish validation message and stores nothing', async () => {
    const user = userEvent.setup()
    render(<SuppliersScreen />)

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('El nombre del proveedor es obligatorio')
    expect(await db.suppliers.count()).toBe(0)
  })

  it('creates a supplier from the form and shows it in the list', async () => {
    const user = userEvent.setup()
    render(<SuppliersScreen />)

    await user.type(screen.getByLabelText('Nombre'), 'Bodega Aurrerá')
    await user.type(screen.getByLabelText('Tipo'), 'Supermercado')
    await user.type(screen.getByLabelText(/Ubicaciones/), 'Centro, Norte')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Bodega Aurrerá')).toBeInTheDocument()
    expect(screen.getByText('Centro, Norte')).toBeInTheDocument()
    expect(await db.suppliers.count()).toBe(1)
  })

  it('warns with the affected product count before deleting a referenced supplier', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('confirm', confirmSpy)
    const supplierId = await createSupplier({ name: 'Bodega Aurrerá', locations: [] })
    for (let i = 0; i < 3; i++) await db.products.add(makeProduct(`Producto ${i}`, supplierId))

    render(<SuppliersScreen />)
    await screen.findByText('Bodega Aurrerá')

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringMatching(/3 productos/))
    await waitFor(() => expect(screen.queryByText('Bodega Aurrerá')).not.toBeInTheDocument())
    expect(await db.suppliers.count()).toBe(0)
  })

  it('keeps the supplier when the delete confirmation is dismissed', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))
    await createSupplier({ name: 'Bodega Aurrerá', locations: [] })

    render(<SuppliersScreen />)
    await screen.findByText('Bodega Aurrerá')

    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByText('Bodega Aurrerá')).toBeInTheDocument()
    expect(await db.suppliers.count()).toBe(1)
  })
})
