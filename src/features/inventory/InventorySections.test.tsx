import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
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
    expect(stockState({ current: 6, min: 2, max: 12 }).label).toBe('En inventario')
    expect(stockState({ current: 3, min: null, max: null }).label).toBe('En inventario')
  })
})

describe('inventory sections on ProductDetail', () => {
  it('shows the stock state, location and recent movements without a Historial tab', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 1, min: 2, max: 12, location: 'refri' })
    await registerMovement(id, { type: 'entrada', qty: 1 })

    renderDetail(id)

    expect(await screen.findByText('Bajo mínimo')).toBeInTheDocument()
    expect(screen.getByText('refri')).toBeInTheDocument()
    // No purchase period configured yet → reminder off.
    expect(screen.getByText('Sin recordatorio')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Historial/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Stock/ }))
    // The stock tab renders before the purchase tab, so its "Ver todos" is first.
    const verTodos = screen.getAllByRole('button', { name: 'Ver todos' })[0]
    await user.click(verTodos)
    const history = await screen.findByRole('dialog', { name: 'Historial de movimientos' })
    expect(within(history).getByText('Entrada +1 → 2')).toBeInTheDocument()
    expect(within(history).queryByText('Editar')).not.toBeInTheDocument()
    expect(within(history).queryByText('Eliminar')).not.toBeInTheDocument()
  })

  it('rejects saving min greater than max with a Spanish error', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 6, min: null, max: null })

    renderDetail(id)
    await screen.findByText(/unidades/)

    await user.click(screen.getByRole('button', { name: 'Editar niveles' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar niveles de stock' })
    // Labels include the "Alerta reposición"/"Capacidad sugerida" badges.
    // fireEvent.change because user-event can't refocus the stepper inputs
    // across the modal re-render in happy-dom.
    fireEvent.change(within(dialog).getByLabelText(/Stock Mínimo/), { target: { value: '8' } })
    fireEvent.change(within(dialog).getByLabelText(/Stock Máximo/), { target: { value: '5' } })
    await user.click(within(dialog).getByRole('button', { name: 'Guardar niveles' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('El mínimo no puede ser mayor que el máximo')
    expect((await db.products.get(id))?.stock.min).toBeNull()
  })

  it('registers an entrada from the movement modal and updates the displayed stock', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 4, min: null, max: null })

    renderDetail(id)
    await screen.findByText(/unidades/)

    await user.click(screen.getByRole('button', { name: 'Registrar movimiento' }))
    const dialog = screen.getByRole('dialog', { name: 'Registrar movimiento' })
    await user.type(within(dialog).getByLabelText(/Cantidad a ingresar/), '6')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    const stock = screen.getByRole('region', { name: 'Stock' })
    expect(await within(stock).findByText('10')).toBeInTheDocument()
    expect(screen.getByText('Entrada +6 → 10')).toBeInTheDocument()
  })

  it('registers an ajuste to an absolute quantity', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 4, min: null, max: null })

    renderDetail(id)
    await screen.findByText(/unidades/)

    await user.click(screen.getByRole('button', { name: 'Registrar movimiento' }))
    const dialog = screen.getByRole('dialog', { name: 'Registrar movimiento' })
    await user.click(within(dialog).getByRole('button', { name: /Ajuste/ }))
    await user.type(within(dialog).getByLabelText(/Cantidad a dejar/), '9')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    const stock = screen.getByRole('region', { name: 'Stock' })
    expect(await within(stock).findByText('9')).toBeInTheDocument()
    expect(screen.getByText('Ajuste +5 → 9')).toBeInTheDocument()
  })

  it('shows a Spanish error for a salida over the stock and keeps everything unchanged', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 2, min: null, max: null })

    renderDetail(id)
    await screen.findByText(/unidades/)

    await user.click(screen.getByRole('button', { name: 'Registrar movimiento' }))
    const dialog = screen.getByRole('dialog', { name: 'Registrar movimiento' })
    await user.click(within(dialog).getByRole('button', { name: /Salida/ }))
    await user.type(within(dialog).getByLabelText(/Cantidad a ingresar/), '5')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('La salida no puede ser mayor que el stock actual')
    const stock = screen.getByRole('region', { name: 'Stock' })
    expect(within(stock).getByText('2')).toBeInTheDocument()
    expect(await db.movements.where('productId').equals(id).count()).toBe(0)
  })

  it('lists history modal entries newest first', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Leche entera', customProps: [] })
    await setStock(id, { current: 4, min: null, max: null })
    await db.movements.bulkAdd([
      { productId: id, date: '2026-09-01T10:00:00.000Z', type: 'entrada', qty: 4, delta: 4, resultingQty: 4 },
      { productId: id, date: '2026-09-03T09:00:00.000Z', type: 'salida', qty: 1, delta: -1, resultingQty: 3 },
    ])

    renderDetail(id)
    await screen.findByRole('heading', { name: 'Leche entera' })

    await user.click(screen.getByRole('button', { name: /Stock/ }))
    const verTodos = screen.getAllByRole('button', { name: 'Ver todos' })[0]
    await user.click(verTodos)
    const dialog = await screen.findByRole('dialog', { name: 'Historial de movimientos' })
    const salida = within(dialog).getByText('Salida -1 → 3')
    const entrada = within(dialog).getByText('Entrada +4 → 4')
    expect(salida.compareDocumentPosition(entrada) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
