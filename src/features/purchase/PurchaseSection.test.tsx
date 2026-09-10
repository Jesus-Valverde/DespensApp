import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ProductDetail } from '../products/ProductDetail'
import { db } from '../../db/db'
import { createProduct } from '../products/api'

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
  await Promise.all([db.products.clear(), db.suppliers.clear()])
})

async function openPurchaseForm(section: HTMLElement) {
  // The design shows the read-only card; the form opens behind "Ver todos".
  await fireEvent.click(within(section).getByRole('button', { name: /Ver todos/ }))
}

describe('purchase section on ProductDetail', () => {
  it('records supplier, prices and a link from the form (spec: record purchase info)', async () => {
    const user = userEvent.setup()
    const ids = await seedSuppliers()
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Detergente' })
    const section = await screen.findByRole('region', { name: 'Info de compra' })
    await openPurchaseForm(section)
    await within(section).findAllByText('Soriana') // wait for the suppliers liveQuery

    await user.selectOptions(within(section).getByLabelText('Proveedor principal'), String(ids.Soriana))
    await user.type(within(section).getByLabelText('Precio referencia'), '25.50')
    await user.type(within(section).getByLabelText(/Enlace web/), 'https://soriana.com/detergente')
    await user.click(within(section).getByRole('button', { name: 'Agregar enlace' }))
    await user.click(within(section).getByRole('button', { name: 'Guardar cambios' }))

    const purchase = (await db.products.get(id))?.purchase
    expect(purchase).toMatchObject({
      primarySupplierId: ids.Soriana,
      originalPrice: 2550,
      links: [{ id: 1, url: 'https://soriana.com/detergente' }],
    })
    expect(await within(section).findByText('$25.50')).toBeInTheDocument()
    // The saved link shows on the read-only card once the modal closes.
    const open = within(section).getByRole('link', { name: 'Abrir tienda en línea' })
    expect(open).toHaveAttribute('href', 'https://soriana.com/detergente')
  })

  it('rejects a negative price with a Spanish message and saves nothing', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Detergente' })
    const section = await screen.findByRole('region', { name: 'Info de compra' })
    await openPurchaseForm(section)

    // happy-dom drops the minus sign when typing into number inputs, so set the value directly.
    fireEvent.change(within(section).getByLabelText('Precio referencia'), { target: { value: '-1' } })
    await user.click(within(section).getByRole('button', { name: 'Guardar cambios' }))

    const alert = await within(section).findByRole('alert')
    expect(alert).toHaveTextContent('El precio no puede ser negativo')
    expect((await db.products.get(id))?.purchase.originalPrice).toBeUndefined()
  })

  it('schedules the next purchase from the last date and weekly period', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Leche entera' })
    const section = await screen.findByRole('region', { name: 'Info de compra' })
    await openPurchaseForm(section)

    // happy-dom does not accept typed date input values, so set the value directly.
    fireEvent.change(within(section).getByLabelText('Fecha de última compra'), {
      target: { value: '2026-09-01' },
    })
    await user.selectOptions(within(section).getByLabelText('Frecuencia de compra'), 'semanal')
    await user.click(within(section).getByRole('button', { name: 'Guardar cambios' }))

    expect((await db.products.get(id))?.purchase.nextPurchaseDate).toBe('2026-09-08')
    expect(await within(section).findByText('8 de septiembre de 2026')).toBeInTheDocument()
    expect(within(section).getByText('Próxima compra')).toBeInTheDocument()
  })

  it('stores secondary suppliers and removes a link before saving', async () => {
    const user = userEvent.setup()
    const ids = await seedSuppliers()
    const id = await createProduct({ title: 'Detergente', customProps: [] })
    await db.products.update(id, {
      purchase: {
        secondarySupplierIds: [],
        links: [{ id: 1, url: 'https://viejo.com/x' }],
        period: null,
      },
    })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Detergente' })
    const section = await screen.findByRole('region', { name: 'Info de compra' })
    await openPurchaseForm(section)
    await within(section).findAllByText('Mercado Libre') // wait for the suppliers liveQuery

    await user.click(within(section).getByRole('checkbox', { name: 'Mercado Libre' }))
    await user.click(within(section).getAllByRole('button', { name: 'Quitar' })[0])
    await user.click(within(section).getByRole('button', { name: 'Guardar cambios' }))

    expect((await db.products.get(id))?.purchase).toMatchObject({
      secondarySupplierIds: [ids['Mercado Libre']],
      links: [],
    })
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
})
