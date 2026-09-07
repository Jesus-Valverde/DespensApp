import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { CartDetail } from './CartDetail'
import { db } from '../../db/db'
import type { CartItem } from '../../db/types'

beforeEach(async () => {
  await Promise.all([db.carts.clear(), db.products.clear(), db.suppliers.clear(), db.movements.clear()])
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function makeProduct(title: string): Promise<number> {
  return (await db.products.add({
    title,
    customProps: [],
    stock: { current: 0, min: null, max: null },
    purchase: { secondarySupplierIds: [], period: null, links: [] },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  })) as number
}

async function makeCart(items: CartItem[]): Promise<number> {
  return (await db.carts.add({
    name: 'Súper de la semana',
    status: 'active',
    origin: 'manual',
    createdAt: '2026-09-01T00:00:00.000Z',
    items,
  })) as number
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/carts" element={<p>LISTA</p>} />
        <Route path="/carts/:id" element={<CartDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CartDetail', () => {
  it('renders items under their supplier group headings (spec: group by distinct suppliers)', async () => {
    const aurrera = (await db.suppliers.add({ name: 'Bodega Aurrerá', locations: [] })) as number
    const leche = await makeProduct('Leche entera')
    const huevos = await makeProduct('Huevos')
    const jabon = await makeProduct('Jabón de barra')
    const cartId = await makeCart([
      { productId: leche, title: 'Leche entera', qty: 2, unitPrice: 2800, supplierId: aurrera, supplierName: 'Bodega Aurrerá' },
      { productId: jabon, title: 'Jabón de barra', qty: 1, unitPrice: 900, supplierId: null, supplierName: 'Sin proveedor' },
      { productId: huevos, title: 'Huevos', qty: 12, unitPrice: 4500, supplierId: aurrera, supplierName: 'Bodega Aurrerá' },
    ])

    renderAt(`/carts/${cartId}`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Súper de la semana' })).toBeInTheDocument()

    const aurreraGroup = screen.getByRole('region', { name: 'Bodega Aurrerá' })
    expect(within(aurreraGroup).getByText('Leche entera')).toBeInTheDocument()
    expect(within(aurreraGroup).getByText('Huevos')).toBeInTheDocument()
    expect(within(aurreraGroup).queryByText('Jabón de barra')).not.toBeInTheDocument()

    const sinProveedor = screen.getByRole('region', { name: 'Sin proveedor' })
    expect(within(sinProveedor).getByText('Jabón de barra')).toBeInTheDocument()
  })

  it('pays the cart from the button: entradas, stock and purchased status (buy-button smoke)', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    const leche = await makeProduct('Leche entera')
    await db.products.update(leche, { stock: { current: 2, min: null, max: null } })
    const jabon = await makeProduct('Jabón de barra')
    const cartId = await makeCart([
      { productId: leche, title: 'Leche entera', qty: 6, unitPrice: 2800, supplierId: null, supplierName: 'Sin proveedor' },
      { productId: jabon, title: 'Jabón de barra', qty: 1, unitPrice: 900, supplierId: null, supplierName: 'Sin proveedor' },
    ])

    renderAt(`/carts/${cartId}`)
    await screen.findByRole('button', { name: 'Pagar carrito' })

    await user.click(screen.getByRole('button', { name: 'Pagar carrito' }))

    expect(await screen.findByText('LISTA')).toBeInTheDocument() // navigated back
    await waitFor(async () => expect((await db.carts.get(cartId))?.status).toBe('purchased'))
    expect((await db.products.get(leche))?.stock.current).toBe(8)
    expect((await db.products.get(jabon))?.stock.current).toBe(1)
    expect(await db.movements.count()).toBe(2)
  })

  it('edits the item quantity and unit price from the detail', async () => {
    const user = userEvent.setup()
    const leche = await makeProduct('Leche entera')
    const cartId = await makeCart([
      { productId: leche, title: 'Leche entera', qty: 2, unitPrice: 2800, supplierId: null, supplierName: 'Sin proveedor' },
    ])

    renderAt(`/carts/${cartId}`)
    const qtyInput = await screen.findByLabelText('Cantidad de Leche entera')
    const priceInput = screen.getByLabelText('Precio de Leche entera')

    await user.clear(qtyInput)
    await user.type(qtyInput, '3')
    fireEvent.blur(qtyInput)

    await user.clear(priceInput)
    await user.type(priceInput, '31.5')
    fireEvent.blur(priceInput)

    await waitFor(async () => {
      const item = (await db.carts.get(cartId))?.items[0]
      expect(item).toMatchObject({ qty: 3, unitPrice: 3150 })
    })
  })

  it('rejects a zero quantity and an invalid price with Spanish messages', async () => {
    const user = userEvent.setup()
    const leche = await makeProduct('Leche entera')
    const cartId = await makeCart([
      { productId: leche, title: 'Leche entera', qty: 2, unitPrice: 2800, supplierId: null, supplierName: 'Sin proveedor' },
    ])

    renderAt(`/carts/${cartId}`)
    const qtyInput = await screen.findByLabelText('Cantidad de Leche entera')
    const priceInput = screen.getByLabelText('Precio de Leche entera')

    await user.clear(qtyInput)
    await user.type(qtyInput, '0')
    fireEvent.blur(qtyInput)
    expect(await screen.findByRole('alert')).toHaveTextContent('La cantidad debe ser mayor a cero')

    await user.clear(priceInput)
    await user.type(priceInput, 'abc')
    fireEvent.blur(priceInput)
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresa un precio válido')

    const item = (await db.carts.get(cartId))?.items[0]
    expect(item).toMatchObject({ qty: 2, unitPrice: 2800 }) // unchanged
  })

  it('keeps the cart active when the cancel confirmation is dismissed', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))
    const cartId = await makeCart([])

    renderAt(`/carts/${cartId}`)
    await user.click(await screen.findByRole('button', { name: 'Cancelar carrito' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Súper de la semana' })).toBeInTheDocument()
    expect((await db.carts.get(cartId))?.status).toBe('active')
  })
})
