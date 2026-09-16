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
  it('shows the stock KPI breakdown splitting sin stock, stock bajo and en inventario', async () => {
    await makeProduct({ title: 'Frijol', stock: { current: 0, min: 5, max: null } }) // sin stock
    await makeProduct({ title: 'Arroz', stock: { current: 4, min: 5, max: null } }) // stock bajo
    await makeProduct({ title: 'Leche', stock: { current: 10, min: 2, max: null } }) // en inventario
    await makeProduct({ title: 'Sal', stock: { current: 0, min: null, max: null } }) // sin stock (sin umbral)

    renderScreen()

    const kpi = await screen.findByRole('region', { name: 'Stock de tus productos' })
    expect(await within(kpi).findByText('Stock de tus productos')).toBeInTheDocument()
    const enInventario = within(kpi).getByText('En inventario').closest('li')!
    expect(enInventario).toHaveTextContent('1')
    const stockBajo = within(kpi).getByText('Stock bajo').closest('li')!
    expect(stockBajo).toHaveTextContent('1')
    const sinStock = within(kpi).getByText('Sin stock').closest('li')!
    expect(sinStock).toHaveTextContent('2')
  })

  it('shows próxima reposición and compra estimada from the nearest active cart', async () => {
    await makeProduct({ title: 'Leche', stock: { current: 5, min: 2, max: null } })
    await makeProduct({ title: 'Atún', stock: { current: 3, min: null, max: null } })
    const base = { origin: 'manual' as const, status: 'active' as const }
    await db.carts.add({
      ...base,
      name: 'Lejano',
      createdAt: '2026-09-01T00:00:00.000Z',
      estimatedDate: '2026-09-20',
      items: [{ productId: 1, title: 'Leche', qty: 1, unitPrice: 1000, supplierId: null, supplierName: 'X' }],
    })
    await db.carts.add({
      ...base,
      name: 'Cercano',
      createdAt: '2026-09-02T00:00:00.000Z',
      estimatedDate: '2026-09-15',
      items: [
        { productId: 1, title: 'Leche', qty: 2, unitPrice: 2800, supplierId: null, supplierName: 'X' },
        { productId: 2, title: 'Atún', qty: 1, unitPrice: 2200, supplierId: null, supplierName: 'X' },
      ],
    })

    renderScreen()

    expect(await screen.findByText('15 de septiembre de 2026')).toBeInTheDocument()
    // Σ qty × unitPrice of the nearest cart: 2×$28.00 + 1×$22.00 = $78.00
    expect(screen.getByText('$78.00')).toBeInTheDocument()
  })

  it('shows em dashes when there is no active cart', async () => {
    await makeProduct({ title: 'Leche', stock: { current: 10, min: 2, max: null } })

    renderScreen()

    expect(await screen.findByText('Stock de tus productos')).toBeInTheDocument()
    expect(screen.getByText('Próxima reposición').closest('div')!.textContent).toContain('—')
    expect(screen.getByText('Compra estimada').closest('div')!.textContent).toContain('—')
  })

  it('shows the first-run welcome card instead of report sections when the pantry is empty', async () => {
    renderScreen()

    expect(await screen.findByRole('heading', { name: 'Empieza tu despensa' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Añadir producto/ })).toHaveAttribute('href', '/products/new')
    expect(screen.queryByText('Stock de tus productos')).not.toBeInTheDocument()
  })

  it('lists recent movements as per-movement cards newest first', async () => {
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
    expect(await within(historial).findByText('-2')).toBeInTheDocument()
    const salidaCard = within(historial).getByText('-2').closest('li')!
    const entradaCard = within(historial).getByText('+6').closest('li')!
    expect(within(salidaCard).getByText('Frijol')).toBeInTheDocument()
    expect(within(salidaCard).getByText('→ 4')).toBeInTheDocument()
    expect(within(salidaCard).getByText('Salida')).toBeInTheDocument()
    expect(within(salidaCard).getByText(/, \d{2}:\d{2}/)).toBeInTheDocument()
    expect(within(entradaCard).getByText('→ 6')).toBeInTheDocument()
    expect(salidaCard.compareDocumentPosition(entradaCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
