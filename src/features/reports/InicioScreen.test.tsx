import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { InicioScreen } from './InicioScreen'
import { db } from '../../db/db'
import type { Product } from '../../db/types'

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.carts.clear()])
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
      <InicioScreen />
    </MemoryRouter>,
  )
}

describe('InicioScreen', () => {
  it('shows faltantes ordered by severity and excludes products above minimum or without one', async () => {
    await makeProduct({ title: 'Frijol', stock: { current: 0, min: 5, max: null } })
    await makeProduct({ title: 'Arroz', stock: { current: 4, min: 5, max: null } })
    await makeProduct({ title: 'Leche', stock: { current: 10, min: 2, max: null } }) // above min
    await makeProduct({ title: 'Sal', stock: { current: 0, min: null, max: null } }) // no threshold

    renderScreen()

    const faltantes = await screen.findByRole('region', { name: 'Faltantes' })
    // The region renders before useLiveQuery delivers data; the count arrives async.
    expect(
      await within(faltantes).findByRole('heading', { name: 'Faltantes (2)' }),
    ).toBeInTheDocument()

    const frijol = within(faltantes).getByText('Frijol')
    const arroz = within(faltantes).getByText('Arroz')
    expect(frijol.compareDocumentPosition(arroz) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    expect(within(faltantes).queryByText('Leche')).not.toBeInTheDocument()
    expect(within(faltantes).queryByText('Sal')).not.toBeInTheDocument()
    expect(within(faltantes).getByText(/Faltan 5/)).toBeInTheDocument()
    expect(within(faltantes).getByText(/Faltan 1/)).toBeInTheDocument()
  })

  it('shows upcoming purchases by next date ascending with overdue first, excluding unscheduled ones', async () => {
    await makeProduct({
      title: 'Café',
      purchase: { secondarySupplierIds: [], period: 'mensual', links: [], nextPurchaseDate: '2026-09-01' },
    })
    await makeProduct({
      title: 'Galletas',
      purchase: { secondarySupplierIds: [], period: 'semanal', links: [], nextPurchaseDate: '2026-09-10' },
    })
    await makeProduct({ title: 'Sal' }) // unscheduled

    renderScreen()

    const proximas = await screen.findByRole('region', { name: 'Próximas compras' })
    expect(
      await within(proximas).findByRole('heading', { name: 'Próximas compras (2)' }),
    ).toBeInTheDocument()

    const overdueDate = within(proximas).getByText(/1 de septiembre de 2026/)
    const upcomingDate = within(proximas).getByText(/10 de septiembre de 2026/)
    expect(overdueDate.compareDocumentPosition(upcomingDate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // The 2026-09-01 item is always overdue (today or earlier), so it carries the marker.
    const cafeRow = within(proximas).getByText('Café').closest('li')!
    expect(within(cafeRow).getByText('Vencida')).toBeInTheDocument()
    expect(within(proximas).queryByText('Sal')).not.toBeInTheDocument()
  })

  it('links to the carts section with the count of active carts', async () => {
    const base = { items: [] as [], origin: 'manual' as const }
    await db.carts.add({ ...base, name: 'Súper', status: 'active', createdAt: '2026-09-01T00:00:00.000Z' })
    await db.carts.add({ ...base, name: 'Fiesta', status: 'active', createdAt: '2026-09-02T00:00:00.000Z' })
    await db.carts.add({ ...base, name: 'Viejo', status: 'purchased', createdAt: '2026-08-01T00:00:00.000Z', purchasedAt: '2026-08-02T00:00:00.000Z' })

    renderScreen()

    const link = await screen.findByRole('link', { name: /Carritos/ })
    expect(link).toHaveTextContent('2 activos')
    expect(link).toHaveAttribute('href', '/carts')
  })

  it('shows the empty states when nothing is due', async () => {
    renderScreen()

    expect(await screen.findByText('Sin productos en falta.')).toBeInTheDocument()
    expect(screen.getByText('Sin compras programadas.')).toBeInTheDocument()
  })
})
