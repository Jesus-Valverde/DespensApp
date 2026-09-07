import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { CartsScreen } from './CartsScreen'
import { db } from '../../db/db'
import { createCart, addCartItem, buyCart, cancelCart } from './api'

beforeEach(async () => {
  await Promise.all([db.carts.clear(), db.products.clear(), db.suppliers.clear(), db.movements.clear()])
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** A product that is always overdue, optionally with a primary supplier. */
async function makeDueProduct(title: string, supplierId?: number): Promise<number> {
  return (await db.products.add({
    title,
    customProps: [],
    stock: { current: 0, min: null, max: null },
    purchase: {
      primarySupplierId: supplierId,
      secondarySupplierIds: [],
      lastPrice: 3050,
      nextPurchaseDate: '2020-01-01',
      period: 'semanal',
      links: [],
    },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  })) as number
}

function renderScreen() {
  render(
    <MemoryRouter>
      <CartsScreen />
    </MemoryRouter>,
  )
}

describe('CartsScreen', () => {
  it('generates a cart from due products with the manual trigger (spec: manual trigger)', async () => {
    const user = userEvent.setup()
    const supplierId = (await db.suppliers.add({ name: 'Bodega Aurrerá', locations: [] })) as number
    const productId = await makeDueProduct('Detergente', supplierId)

    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Generar carrito' }))

    expect(await screen.findByText(/^Carrito generado/)).toBeInTheDocument()
    const [cart] = await db.carts.toArray()
    expect(cart).toMatchObject({ status: 'active', origin: 'auto' })
    expect(cart.items).toEqual([
      { productId, title: 'Detergente', qty: 1, unitPrice: 3050, supplierId, supplierName: 'Bodega Aurrerá' },
    ])
  })

  it('shows a Spanish notice and creates nothing when no product is due', async () => {
    const user = userEvent.setup()
    await db.products.add({
      title: 'Sin calendario',
      customProps: [],
      stock: { current: 0, min: null, max: null },
      purchase: { secondarySupplierIds: [], period: null, links: [] },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    })

    renderScreen()
    await user.click(screen.getByRole('button', { name: 'Generar carrito' }))

    // The notice appears after generateAutoCart's async pass — await it.
    expect(await screen.findByRole('alert')).toHaveTextContent('No hay productos pendientes de compra')
    expect(await db.carts.count()).toBe(0)
  })

  it('lists active carts under Activos and history with status labels', async () => {
    const productId = await makeDueProduct('Detergente')

    const superId = await createCart({ name: 'Súper de la semana' })
    await addCartItem(superId, { productId, qty: 2 })

    const pagadoId = await createCart({ name: 'Ya pagado' })
    await addCartItem(pagadoId, { productId, qty: 1 })
    await buyCart(pagadoId)

    const viejoId = await createCart({ name: 'Viejo' })
    await cancelCart(viejoId)

    renderScreen()
    await screen.findByText('Súper de la semana')

    const activos = screen.getByRole('region', { name: 'Activos' })
    expect(within(activos).getByRole('link', { name: /Súper de la semana/ })).toBeInTheDocument()

    const historial = screen.getByRole('region', { name: 'Historial' })
    expect(within(historial).getByText(/Comprado/)).toBeInTheDocument()
    expect(within(historial).getByText(/Cancelado/)).toBeInTheDocument()
  })
})
