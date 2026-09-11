import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ProductDetail } from '../products/ProductDetail'
import { db } from '../../db/db'
import { createProduct } from '../products/api'
import { createCart } from '../carts/api'

function renderDetail(id: number) {
  render(
    <MemoryRouter initialEntries={[`/products/${id}`]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function seedSuppliers(): Promise<Record<string, number>> {
  const soriana = (await db.suppliers.add({ name: 'Soriana', locations: [] })) as number
  const mercadolibre = (await db.suppliers.add({ name: 'Mercado Libre', locations: [] })) as number
  return { Soriana: soriana, 'Mercado Libre': mercadolibre }
}

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.suppliers.clear(), db.carts.clear()])
})

describe('purchase section on ProductDetail', () => {
  it('records the primary supplier with price and link from the vincular modal', async () => {
    const user = userEvent.setup()
    const ids = await seedSuppliers()
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Detergente' })
    // The provider row opens the "Proveedores del producto" modal.
    await user.click(await screen.findByRole('button', { name: /Sin proveedor/ }))
    await user.click(screen.getByRole('button', { name: /Vincular nuevo proveedor/ }))

    const dialog = screen.getByRole('dialog', { name: 'Vincular nuevo proveedor' })
    await user.selectOptions(within(dialog).getByLabelText('Seleccionar proveedor'), String(ids.Soriana))
    // The visible label reads "Principal"; the DOM text is lowercase (CSS capitalize).
    await user.click(within(dialog).getByLabelText(/principal/i))
    await user.type(within(dialog).getByLabelText('Precio referencia'), '25.50')
    await user.selectOptions(within(dialog).getByLabelText('Frecuencia estimada'), 'mensual')
    await user.type(within(dialog).getByLabelText(/Enlace web/), 'https://soriana.com/detergente')
    await user.click(within(dialog).getByRole('button', { name: 'Vincular proveedor' }))

    const purchase = await waitFor(async () => {
      const stored = (await db.products.get(id))?.purchase
      expect(stored?.primarySupplierId).toEqual(ids.Soriana)
      return stored
    })
    expect(purchase?.supplierLinks).toEqual([
      {
        supplierId: ids.Soriana,
        price: 2550,
        frequency: 'mensual',
        url: 'https://soriana.com/detergente',
        notes: undefined,
      },
    ])

    // The reference card falls back to the supplier's web price when the
    // product-level field is empty; last price stays empty until a real purchase.
    const section = screen.getByRole('region', { name: 'Info de compra' })
    expect(await within(section).findByText('$25.50')).toBeInTheDocument()
    expect(within(section).getByText('Precio en página web')).toBeInTheDocument()
    expect(within(section).getByText('Aún sin compras')).toBeInTheDocument()
    // Frecuencia falls back to the supplier's frequency too.
    expect(await within(section).findByText('Mensual')).toBeInTheDocument()
  })

  it('rejects a negative price with a Spanish message and saves nothing', async () => {
    const user = userEvent.setup()
    const ids = await seedSuppliers()
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Detergente' })
    await user.click(await screen.findByRole('button', { name: /Sin proveedor/ }))
    await user.click(screen.getByRole('button', { name: /Vincular nuevo proveedor/ }))

    const dialog = screen.getByRole('dialog', { name: 'Vincular nuevo proveedor' })
    await within(dialog).findAllByText('Soriana') // wait for the suppliers liveQuery
    await user.selectOptions(within(dialog).getByLabelText('Seleccionar proveedor'), String(ids.Soriana))
    // happy-dom drops the minus sign when typing into number inputs, so set the value directly.
    fireEvent.change(within(dialog).getByLabelText('Precio referencia'), { target: { value: '-1' } })
    await user.click(within(dialog).getByRole('button', { name: 'Vincular proveedor' }))

    const alert = await within(dialog).findByRole('alert')
    expect(alert).toHaveTextContent('El precio no puede ser negativo')
    expect((await db.products.get(id))?.purchase.supplierLinks).toBeUndefined()
  })

  it('shows the scheduled next purchase date on the card', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await db.products.update(id, {
      purchase: {
        secondarySupplierIds: [],
        links: [],
        period: 'semanal',
        lastPurchaseDate: '2026-09-01',
        nextPurchaseDate: '2026-09-08',
      },
    })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Leche entera' })
    const section = await screen.findByRole('region', { name: 'Info de compra' })

    expect(await within(section).findByText('8 de septiembre de 2026')).toBeInTheDocument()
    expect(within(section).getByText('Próxima compra')).toBeInTheDocument()
  })

  it('links a supplier with per-supplier metadata from the suppliers modal', async () => {
    const user = userEvent.setup()
    const ids = await seedSuppliers()
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Detergente' })
    // The provider row opens the "Proveedores del producto" modal.
    await user.click(await screen.findByRole('button', { name: /Sin proveedor/ }))
    await user.click(screen.getByRole('button', { name: /Vincular nuevo proveedor/ }))

    const dialog = screen.getByRole('dialog', { name: 'Vincular nuevo proveedor' })
    await user.selectOptions(within(dialog).getByLabelText('Seleccionar proveedor'), String(ids.Soriana))
    await user.type(within(dialog).getByLabelText('Precio referencia'), '26.50')
    await user.selectOptions(within(dialog).getByLabelText('Frecuencia estimada'), 'mensual')
    await user.click(within(dialog).getByRole('button', { name: 'Vincular proveedor' }))

    const purchase = await waitFor(async () => {
      const stored = (await db.products.get(id))?.purchase
      expect(stored?.secondarySupplierIds).toEqual([ids.Soriana])
      return stored
    })
    expect(purchase?.supplierLinks).toEqual([
      { supplierId: ids.Soriana, price: 2650, frequency: 'mensual', url: undefined, notes: undefined },
    ])
  })

  it('adds the product to a chosen active cart from the modal', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Detergente', customProps: [] })
    await createCart({ name: 'Carrito Soriana' })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Detergente' })
    await user.click(await screen.findByRole('button', { name: 'Agregar al carrito' }))

    const dialog = screen.getByRole('dialog', { name: 'Agregar a carrito' })
    // The first active cart comes preselected; bump the quantity to 2.
    await user.click(within(dialog).getByRole('button', { name: 'Aumentar cantidad' }))
    await user.click(within(dialog).getByRole('button', { name: /Agregar al carrito/ }))

    const cart = (await db.carts.toArray()).find((candidate) => candidate.name === 'Carrito Soriana')
    expect(cart?.items).toEqual([
      expect.objectContaining({ productId: id, qty: 2, title: 'Detergente' }),
    ])
  })

  it('creates a new cart with budget and estimated date from the modal', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Detergente' })
    await user.click(await screen.findByRole('button', { name: 'Agregar al carrito' }))
    await user.click(screen.getByRole('button', { name: 'Crear nuevo carrito' }))

    const dialog = screen.getByRole('dialog', { name: 'Crear nuevo carrito' })
    await user.type(within(dialog).getByLabelText(/Nombre del carrito/), 'Súper Quincenal')
    await user.type(within(dialog).getByLabelText(/Presupuesto/), '1200')
    await user.type(within(dialog).getByLabelText(/Fecha estimada/), '2026-09-20')
    await user.click(within(dialog).getByRole('button', { name: 'Crear carrito' }))

    const cart = await waitFor(async () => {
      const created = (await db.carts.toArray()).find((candidate) => candidate.name === 'Súper Quincenal')
      expect(created).toBeDefined()
      return created
    })
    expect(cart).toMatchObject({ budget: 120000, estimatedDate: '2026-09-20', status: 'active' })
    // The new cart lands in the pick list preselected.
    expect(await screen.findByRole('dialog', { name: 'Agregar a carrito' })).toBeInTheDocument()
  })
})
