import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ProductDetail } from '../products/ProductDetail'
import { db } from '../../db/db'
import { createProduct } from '../products/api'
import { setStock, registerMovement } from './api'
import { stockState } from './StockSection'

function renderDetail(id: number) {
  render(
    <MemoryRouter initialEntries={[`/products/${id}`]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.movements.clear()])
})

describe('stockState (pure)', () => {
  it('classifies the stock level against min and max', () => {
    expect(stockState({ current: 0, min: null, max: null }).label).toBe('Sin stock')
    expect(stockState({ current: 1, min: 2, max: 12 }).label).toBe('Bajo mínimo')
    expect(stockState({ current: 2, min: 2, max: 12 }).label).toBe('Bajo mínimo')
    expect(stockState({ current: 13, min: 2, max: 12 }).label).toBe('Sobre máximo')
    expect(stockState({ current: 6, min: 2, max: 12 }).label).toBe('En rango')
    expect(stockState({ current: 3, min: null, max: null }).label).toBe('En rango')
  })
})

describe('inventory sections on ProductDetail', () => {
  it('shows stock levels, location and a low-stock state, and the bitácora without edit/delete controls', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 1, min: 2, max: 12, location: 'refri' })
    await registerMovement(id, { type: 'entrada', qty: 1 })

    renderDetail(id)

    expect(await screen.findByText('Bajo mínimo')).toBeInTheDocument()
    expect(screen.getByText('Existencias: 2 · Mínimo: 2 · Máximo: 12 · refri')).toBeInTheDocument()

    const bitacora = screen.getByRole('region', { name: 'Bitácora' })
    const rows = await within(bitacora).findAllByRole('listitem')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('Entrada +1 → 2')
    expect(within(bitacora).queryByRole('button')).not.toBeInTheDocument()
    expect(within(bitacora).queryByText('Editar')).not.toBeInTheDocument()
    expect(within(bitacora).queryByText('Eliminar')).not.toBeInTheDocument()
  })

  it('rejects saving min greater than max with a Spanish error', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 6, min: null, max: null })

    renderDetail(id)
    await screen.findByText(/Existencias: 6/)

    await user.clear(screen.getByLabelText('Mínimo'))
    await user.type(screen.getByLabelText('Mínimo'), '8')
    await user.clear(screen.getByLabelText('Máximo'))
    await user.type(screen.getByLabelText('Máximo'), '5')
    await user.click(screen.getByRole('button', { name: 'Guardar stock' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('El mínimo no puede ser mayor que el máximo')
    expect((await db.products.get(id))?.stock.min).toBeNull()
  })

  it('registers an entrada and updates the displayed stock', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 4, min: null, max: null })

    renderDetail(id)
    await screen.findByText(/Existencias: 4/)

    await user.type(screen.getByLabelText('Cantidad'), '6')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByText(/Existencias: 10/)).toBeInTheDocument()
    const bitacora = screen.getByRole('region', { name: 'Bitácora' })
    expect(within(bitacora).getByText('Entrada +6 → 10')).toBeInTheDocument()
  })

  it('registers an ajuste to an absolute quantity', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 4, min: null, max: null })

    renderDetail(id)
    await screen.findByText(/Existencias: 4/)

    await user.selectOptions(screen.getByLabelText('Tipo de movimiento'), 'ajuste')
    await user.type(screen.getByLabelText('Cantidad resultante'), '9')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByText(/Existencias: 9/)).toBeInTheDocument()
    const bitacora = screen.getByRole('region', { name: 'Bitácora' })
    expect(within(bitacora).getByText('Ajuste +5 → 9')).toBeInTheDocument()
  })

  it('shows a Spanish error for a salida over the stock and keeps everything unchanged', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 2, min: null, max: null })

    renderDetail(id)
    await screen.findByText(/Existencias: 2/)

    await user.selectOptions(screen.getByLabelText('Tipo de movimiento'), 'salida')
    await user.type(screen.getByLabelText('Cantidad'), '5')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('La salida no puede ser mayor que el stock actual')
    expect(screen.getByText(/Existencias: 2/)).toBeInTheDocument()
    expect(await db.movements.where('productId').equals(id).count()).toBe(0)
  })

  it('lists bitácora entries newest first', async () => {
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 4, min: null, max: null })
    await db.movements.bulkAdd([
      { productId: id, date: '2026-09-01T10:00:00.000Z', type: 'entrada', qty: 4, delta: 4, resultingQty: 4 },
      { productId: id, date: '2026-09-03T09:00:00.000Z', type: 'salida', qty: 1, delta: -1, resultingQty: 3 },
    ])

    renderDetail(id)
    await screen.findByText(/Existencias: 4/)

    const rows = await within(screen.getByRole('region', { name: 'Bitácora' })).findAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Salida -1 → 3')
    expect(rows[1]).toHaveTextContent('Entrada +4 → 4')
  })
})
