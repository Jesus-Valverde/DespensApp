import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { InicioScreen } from './InicioScreen'
import { db } from '../../db/db'
import type { Product } from '../../db/types'

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.carts.clear(), db.lists.clear(), db.movements.clear()])
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
  it('splits Faltantes (sin stock) from Stock bajo, excluding products above min or without one', async () => {
    await makeProduct({ title: 'Frijol', stock: { current: 0, min: 5, max: null } })
    await makeProduct({ title: 'Arroz', stock: { current: 4, min: 5, max: null } })
    await makeProduct({ title: 'Leche', stock: { current: 10, min: 2, max: null } }) // above min
    await makeProduct({ title: 'Sal', stock: { current: 0, min: null, max: null } }) // no threshold

    renderScreen()

    // The screen gates on its live queries; await the regions before asserting.
    const faltantes = await screen.findByRole('region', { name: 'Faltantes' })
    expect(await within(faltantes).findByText('Frijol')).toBeInTheDocument()
    expect(within(faltantes).getByText(/Faltan 5/)).toBeInTheDocument()
    expect(within(faltantes).queryByText('Arroz')).not.toBeInTheDocument()
    expect(within(faltantes).queryByText('Leche')).not.toBeInTheDocument()

    const bajo = await screen.findByRole('region', { name: 'Stock bajo' })
    expect(await within(bajo).findByText('Arroz')).toBeInTheDocument()
    expect(within(bajo).getByText(/Quedan 4/)).toBeInTheDocument()
    expect(within(bajo).queryByText('Sal')).not.toBeInTheDocument()
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
    expect(await within(proximas).findByText('Café')).toBeInTheDocument()

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
    expect(link).toHaveTextContent('activos')
    expect(link).toHaveAttribute('href', '/compras/carritos')
  })

  it('shows the first-run welcome card instead of report sections when the pantry is empty', async () => {
    renderScreen()

    expect(await screen.findByRole('heading', { name: 'Empieza tu despensa' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Añadir producto/ })).toHaveAttribute('href', '/products/new')
    expect(screen.queryByText('Sin productos en falta.')).not.toBeInTheDocument()
    expect(screen.queryByText('Sin alertas de stock bajo.')).not.toBeInTheDocument()
    expect(screen.queryByText('Sin compras programadas.')).not.toBeInTheDocument()
  })

  it('lists recent movements newest first with product titles', async () => {
    const productId = (await db.products.add({
      title: 'Frijol',
      customProps: [],
      stock: { current: 6, min: null, max: null },
      purchase: { secondarySupplierIds: [], period: null, links: [] },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    } as Product)) as number

    await db.movements.add({
      productId,
      type: 'entrada',
      qty: 6,
      delta: 6,
      resultingQty: 6,
      date: '2026-09-05T10:00:00.000Z',
    })
    await db.movements.add({
      productId,
      type: 'salida',
      qty: 2,
      delta: -2,
      resultingQty: 4,
      date: '2026-09-06T10:00:00.000Z',
    })

    renderScreen()

    const historial = await screen.findByRole('region', { name: 'Historial de movimientos' })
    expect(await within(historial).findByText('Salida -2 → 4')).toBeInTheDocument()
    const salidaRow = within(historial).getByText('Salida -2 → 4').closest('li')!
    const entradaRow = within(historial).getByText('Entrada +6 → 6').closest('li')!
    expect(salidaRow.compareDocumentPosition(entradaRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
