import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
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

describe('purchase section on ProductDetail', () => {
  it('records supplier, prices and a link from the form (spec: record purchase info)', async () => {
    const user = userEvent.setup()
    const ids = await seedSuppliers()
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Detergente' })
    const section = await screen.findByRole('region', { name: 'Info de compra' })
    await within(section).findAllByText('Soriana') // wait for the suppliers liveQuery

    await user.selectOptions(within(section).getByLabelText('Proveedor principal'), String(ids.Soriana))
    await user.type(within(section).getByLabelText('Precio original'), '25.50')
    await user.type(within(section).getByLabelText('Nuevo enlace'), 'https://soriana.com/detergente')
    await user.click(within(section).getByRole('button', { name: 'Agregar enlace' }))
    await user.click(within(section).getByRole('button', { name: 'Guardar info de compra' }))

    const purchase = (await db.products.get(id))?.purchase
    expect(purchase).toMatchObject({
      primarySupplierId: ids.Soriana,
      originalPrice: 2550,
      links: [{ id: 1, url: 'https://soriana.com/detergente' }],
    })
    expect(await within(section).findByText('$25.50')).toBeInTheDocument()
    const open = within(section).getByRole('link', { name: 'Abrir' })
    expect(open).toHaveAttribute('href', 'https://soriana.com/detergente')
  })

  it('rejects a negative price with a Spanish message and saves nothing', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    renderDetail(id)
    await screen.findByRole('heading', { level: 1, name: 'Detergente' })
    const section = await screen.findByRole('region', { name: 'Info de compra' })

    // happy-dom drops the minus sign when typing into number inputs, so set the value directly.
    fireEvent.change(within(section).getByLabelText('Precio original'), { target: { value: '-1' } })
    await user.click(within(section).getByRole('button', { name: 'Guardar info de compra' }))

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

    // happy-dom does not accept typed date input values, so set the value directly.
    fireEvent.change(within(section).getByLabelText('Fecha de última compra'), {
      target: { value: '2026-09-01' },
    })
    await user.selectOptions(within(section).getByLabelText('Período'), 'semanal')
    await user.click(within(section).getByRole('button', { name: 'Guardar info de compra' }))

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
    await within(section).findAllByText('Mercado Libre') // wait for the suppliers liveQuery

    await user.click(within(section).getByRole('checkbox', { name: 'Mercado Libre' }))
    await user.click(within(section).getAllByRole('button', { name: 'Quitar' })[0])
    await user.click(within(section).getByRole('button', { name: 'Guardar info de compra' }))

    expect((await db.products.get(id))?.purchase).toMatchObject({
      secondarySupplierIds: [ids['Mercado Libre']],
      links: [],
    })
  })
})
