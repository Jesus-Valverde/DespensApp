import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ProductDetail } from './ProductDetail'
import { ProductList } from './ProductList'
import { db } from '../../db/db'
import { createProduct } from './api'

const originalCreate = URL.createObjectURL
const originalRevoke = URL.revokeObjectURL

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/products" element={<ProductList />} />
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
    expect(screen.getByText('Ace')).toBeInTheDocument()
    expect(screen.getByText('1 L')).toBeInTheDocument()
    expect(screen.getByText('Lavandería')).toBeInTheDocument()
    expect(screen.getByText('Pagar con tarjeta: sí')).toBeInTheDocument()
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

    await user.click(await screen.findByRole('button', { name: 'Duplicar' }))

    const copy = await screen.findByRole('heading', { level: 1, name: 'Detergente (copia)' })
    expect(copy).toBeInTheDocument()
    expect(await db.products.count()).toBe(2)
  })

  it('deletes the product after Spanish confirmation and returns to the list', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.fn().mockReturnValue(true)
    vi.stubGlobal('confirm', confirmSpy)
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

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Detergente'))
    await screen.findByText(/Sin productos/i)
    expect(await db.products.count()).toBe(0)
    expect(await db.movements.count()).toBe(0)
  })
})
