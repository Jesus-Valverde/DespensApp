import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { CatalogView } from './ProductList'
import { db } from '../../db/db'
import { createProduct } from './api'

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.productDefs.clear()])
})

/** Card link accessible name starts with the id pill: "#3Leche entera" (pill
 * and title are sibling spans, no separator guaranteed). */
const cardLinkName = (id: number, title: string) => new RegExp(`^#${id}\\s*${title}`)

describe('ProductList', () => {
  it('renders the catalog products as links with their id, details and eye action', async () => {
    const lecheId = await createProduct({
      title: 'Leche entera',
      brand: 'Alpura',
      content: '1',
      unit: 'L',
      customProps: [],
    })
    const detergenteId = await createProduct({ title: 'Detergente', area: 'Lavandería', customProps: [] })

    render(
      <MemoryRouter>
        <CatalogView />
      </MemoryRouter>,
    )

    const leche = await screen.findByRole('link', { name: cardLinkName(lecheId, 'Leche entera') })
    expect(leche).toHaveAttribute('href', `/products/${lecheId}`)
    expect(screen.getByRole('link', { name: cardLinkName(detergenteId, 'Detergente') })).toBeInTheDocument()
    // Subtitle: contenido unidad - marca ("modelo - contenido unidad - marca").
    expect(screen.getByText('1 L - Alpura')).toBeInTheDocument()
    // The area also appears as a filter chip — any match is fine here.
    expect(screen.getAllByText(/Lavandería/).length).toBeGreaterThan(0)

    // The kebab edit action became an eye action to the detail screen.
    expect(screen.getByRole('link', { name: 'Ver detalle de Leche entera' })).toHaveAttribute(
      'href',
      `/products/${lecheId}`,
    )
    expect(screen.getByRole('link', { name: 'Ver detalle de Detergente' })).toHaveAttribute(
      'href',
      `/products/${detergenteId}`,
    )
    expect(screen.queryByRole('link', { name: /Editar/ })).not.toBeInTheDocument()
  })

  it('filters the catalog with the search box', async () => {
    const user = userEvent.setup()
    const lecheId = await createProduct({ title: 'Leche entera', brand: 'Alpura', customProps: [] })
    const detergenteId = await createProduct({ title: 'Detergente', customProps: [] })

    render(
      <MemoryRouter>
        <CatalogView />
      </MemoryRouter>,
    )
    await screen.findByRole('link', { name: cardLinkName(lecheId, 'Leche entera') })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar en catálogo' }), 'leche')

    expect(screen.getByRole('link', { name: cardLinkName(lecheId, 'Leche entera') })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: cardLinkName(detergenteId, 'Detergente') })).not.toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar en catálogo' }))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en catálogo' }), 'zzz')
    expect(screen.getByText(/Sin resultados/)).toBeInTheDocument()
  })

  it('shows the empty state when the catalog has no products', async () => {
    render(
      <MemoryRouter>
        <CatalogView />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Sin productos/i)).toBeInTheDocument()
    const links = screen.queryAllByRole('link', { name: /Leche|Detergente/ })
    expect(links).toHaveLength(0)
  })
})
