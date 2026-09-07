import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ProductList } from './ProductList'
import { db } from '../../db/db'
import { createProduct } from './api'

beforeEach(async () => {
  await db.products.clear()
})

describe('ProductList', () => {
  it('renders the catalog products as links with their details', async () => {
    const lecheId = await createProduct({
      title: 'Leche entera',
      brand: 'Alpura',
      contentSize: '1 L',
      customProps: [],
    })
    await createProduct({ title: 'Detergente', area: 'Lavandería', customProps: [] })

    render(
      <MemoryRouter>
        <ProductList />
      </MemoryRouter>,
    )

    const leche = await screen.findByRole('link', { name: /Leche entera/ })
    expect(leche).toHaveAttribute('href', `/products/${lecheId}`)
    expect(screen.getByRole('link', { name: /Detergente/ })).toBeInTheDocument()
    expect(screen.getByText(/Alpura/)).toBeInTheDocument()
    expect(screen.getByText(/Lavandería/)).toBeInTheDocument()
  })

  it('shows the empty state when the catalog has no products', async () => {
    render(
      <MemoryRouter>
        <ProductList />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Sin productos/i)).toBeInTheDocument()
    const links = screen.queryAllByRole('link', { name: /Leche|Detergente/ })
    expect(links).toHaveLength(0)
  })
})
