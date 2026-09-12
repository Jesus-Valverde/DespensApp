import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ProductDetail } from './ProductDetail'
import { CatalogView } from './ProductList'
import { db } from '../../db/db'
import { createProduct } from './api'

const originalCreate = URL.createObjectURL
const originalRevoke = URL.revokeObjectURL

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/products" element={<CatalogView />} />
        <Route path="/products/:id" element={<ProductDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await db.products.clear()
})

afterEach(() => {
  URL.createObjectURL = originalCreate
  URL.revokeObjectURL = originalRevoke
  vi.restoreAllMocks()
})

describe('ProductDetail', () => {
  it('shows the datos and the image placeholder for a product without image', async () => {
    const id = await createProduct({
      title: 'Detergente',
      brand: 'Ace',
      contentSize: '1 L',
      area: 'Lavandería',
      customProps: [{ key: 'Pagar con tarjeta', value: 'sí' }],
    })

    renderAt(`/products/${id}`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Detergente' })).toBeInTheDocument()
    // The design shows the brand in the hero subtitle and again in the Marca row.
    expect(screen.getAllByText('Ace').length).toBeGreaterThan(0)
    expect(screen.getByText('1 L')).toBeInTheDocument()
    expect(screen.getByText('Lavandería')).toBeInTheDocument()
    expect(screen.getByText('Pagar con tarjeta')).toBeInTheDocument()
    expect(screen.getByText('sí')).toBeInTheDocument()
    expect(screen.getByText('Sin imagen')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders the stored image through an object URL', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:stored-1')
    URL.revokeObjectURL = vi.fn()
    const id = await createProduct({
      title: 'Con foto',
      customProps: [],
      image: new Blob(['jpeg'], { type: 'image/jpeg' }),
    })

    renderAt(`/products/${id}`)

    const img = await screen.findByRole('img')
    expect(img).toHaveAttribute('src', 'blob:stored-1')
    expect(screen.queryByText('Sin imagen')).not.toBeInTheDocument()
  })

  it('duplicates the product and opens the copy', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Detergente', brand: 'Ace', customProps: [] })

    renderAt(`/products/${id}`)

    await user.click(await screen.findByRole('button', { name: 'Crear copia' }))

    const copy = await screen.findByRole('heading', { level: 1, name: 'Detergente (copia)' })
    expect(copy).toBeInTheDocument()
    expect(await db.products.count()).toBe(2)
  })

  it('deletes the product after the confirmation modal and returns to the list', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Detergente', customProps: [] })
    await db.movements.add({
      productId: id,
      date: '2026-09-01T10:00:00.000Z',
      type: 'entrada',
      qty: 1,
      delta: 1,
      resultingQty: 1,
    })

    renderAt(`/products/${id}`)
    await user.click(await screen.findByRole('button', { name: 'Eliminar' }))

    const dialog = await screen.findByRole('dialog', { name: 'Eliminar producto' })
    expect(within(dialog).getByText('Detergente')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Sí, eliminar' }))

    await screen.findByText(/Sin productos/i)
    expect(await db.products.count()).toBe(0)
    expect(await db.movements.count()).toBe(0)
  })

  it('edits custom properties from the modal and persists them', async () => {
    const user = userEvent.setup()
    const id = await createProduct({
      title: 'Detergente',
      customProps: [{ key: 'Pagar con tarjeta', value: 'sí' }],
    })

    renderAt(`/products/${id}`)
    await user.click(await screen.findByRole('button', { name: 'Editar propiedades' }))

    const dialog = screen.getByRole('dialog', { name: 'Editar propiedades' })
    await user.clear(within(dialog).getByLabelText('Valor'))
    await user.type(within(dialog).getByLabelText('Valor'), 'no')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(async () => {
      const stored = await db.products.get(id)
      expect(stored?.customProps[0]).toEqual({ key: 'Pagar con tarjeta', value: 'no' })
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a Spanish error when saving a property without a name', async () => {
    const user = userEvent.setup()
    const id = await createProduct({ title: 'Detergente', customProps: [] })

    renderAt(`/products/${id}`)
    await user.click(await screen.findByRole('button', { name: 'Editar propiedades' }))

    const dialog = screen.getByRole('dialog', { name: 'Editar propiedades' })
    await user.click(within(dialog).getByRole('button', { name: 'Agregar propiedad' }))
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('La propiedad debe tener un nombre')
    expect((await db.products.get(id))?.customProps).toHaveLength(0)
  })
})
