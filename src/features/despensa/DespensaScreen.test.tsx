import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { DespensaScreen } from './DespensaScreen'
import { db } from '../../db/db'
import type { Product } from '../../db/types'

beforeEach(async () => {
  await db.products.clear()
})

async function makeProduct(patch: Partial<Product>): Promise<void> {
  await db.products.add({
    customProps: [],
    stock: { current: 0, min: null, max: null },
    purchase: { secondarySupplierIds: [], period: null, links: [] },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...patch,
  } as Product)
}

function renderScreen() {
  render(
    <MemoryRouter>
      <DespensaScreen />
    </MemoryRouter>,
  )
}

describe('DespensaScreen', () => {
  it('shows the friendly empty state when the catalog is empty', async () => {
    renderScreen()

    expect(await screen.findByText('Tu despensa está vacía')).toBeInTheDocument()
    const add = screen.getByRole('link', { name: 'Añadir a Despensa' })
    expect(add).toHaveAttribute('href', '/products/new')
  })

  it('lists pantry cards with stock badges and the article count', async () => {
    await makeProduct({ title: 'Leche Lala', area: 'Refri', stock: { current: 0, min: 2, max: null } })
    await makeProduct({ title: 'Arroz', area: 'Alacena', stock: { current: 5, min: 2, max: null } })

    renderScreen()

    expect(await screen.findByText('Leche Lala')).toBeInTheDocument()
    expect(screen.getByText('Arroz')).toBeInTheDocument()
    expect(screen.getByText('Sin stock')).toBeInTheDocument()
    expect(screen.getByText('En inventario')).toBeInTheDocument()
    expect(screen.getByText(/2 Artículos/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Catálogo' })).toHaveAttribute(
      'href',
      '/despensa/catalogo',
    )
  })

  it('filters by area using the chips', async () => {
    const user = userEvent.setup()
    await makeProduct({ title: 'Leche Lala', area: 'Refri' })
    await makeProduct({ title: 'Jabón', area: 'Limpieza' })

    renderScreen()
    await screen.findByText('Leche Lala')

    await user.click(screen.getByRole('button', { name: 'Refri' }))
    expect(screen.getByText('Leche Lala')).toBeInTheDocument()
    expect(screen.queryByText('Jabón')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpieza' }))
    expect(screen.getByText('Jabón')).toBeInTheDocument()
    expect(screen.queryByText('Leche Lala')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Todos' }))
    expect(screen.getByText('Leche Lala')).toBeInTheDocument()
    expect(screen.getByText('Jabón')).toBeInTheDocument()
  })
})
