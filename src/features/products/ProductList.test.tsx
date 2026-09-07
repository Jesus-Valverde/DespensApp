import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ProductList } from './ProductList'
import { db } from '../../db/db'
import { createProduct } from './api'

beforeEach(async () => {
  await db.products.clear()
})

describe('ProductList', () => {
  it('renders the catalog products as links with their details and edit actions', async () => {
    const lecheId = await createProduct({
      title: 'Leche entera',
      brand: 'Alpura',
      contentSize: '1 L',
      customProps: [],
    })
    const detergenteId = await createProduct({ title: 'Detergente', area: 'Lavandería', customProps: [] })

    render(
      <MemoryRouter>
        <ProductList />
      </MemoryRouter>,
    )

    // Anchored: the kebab "Editar …" links also mention the title.
    const leche = await screen.findByRole('link', { name: /^Leche entera/ })
    expect(leche).toHaveAttribute('href', `/products/${lecheId}`)
    expect(screen.getByRole('link', { name: /^Detergente/ })).toBeInTheDocument()
    expect(screen.getByText(/Alpura/)).toBeInTheDocument()
    expect(screen.getByText(/Lavandería/)).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Editar Leche entera' })).toHaveAttribute(
      'href',
      `/products/${lecheId}/edit`,
    )
    expect(screen.getByRole('link', { name: 'Editar Detergente' })).toHaveAttribute(
      'href',
      `/products/${detergenteId}/edit`,
    )
    expect(screen.getByText(/2 en catálogo/)).toBeInTheDocument()
  })

  it('filters the catalog with the search box', async () => {
    const user = userEvent.setup()
    await createProduct({ title: 'Leche entera', brand: 'Alpura', customProps: [] })
    await createProduct({ title: 'Detergente', customProps: [] })

    render(
      <MemoryRouter>
        <ProductList />
      </MemoryRouter>,
    )
    await screen.findByRole('link', { name: /^Leche entera/ })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar en catálogo' }), 'leche')

    expect(screen.getByRole('link', { name: /^Leche entera/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Detergente/ })).not.toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar en catálogo' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en catálogo' }), 'zzz')
    expect(screen.getByText(/Sin resultados/)).toBeInTheDocument()
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
