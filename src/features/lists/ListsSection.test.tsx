import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ListsSection } from './ListsSection'
import { db } from '../../db/db'

beforeEach(async () => {
  await Promise.all([db.lists.clear(), db.products.clear()])
})

async function makeProduct(title: string): Promise<number> {
  return (await db.products.add({
    title,
    customProps: [],
    stock: { current: 1, min: null, max: null },
    purchase: { secondarySupplierIds: [], period: null, links: [] },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  })) as number
}

async function makeList(title: string, productIds: number[] = []): Promise<number> {
  return (await db.lists.add({
    title,
    productIds,
    createdAt: '2026-09-01T00:00:00.000Z',
  })) as number
}

function renderSection(productId: number) {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<ListsSection productId={productId} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ListsSection', () => {
  it('shows the memberships of the product and removes one', async () => {
    const user = userEvent.setup()
    const atun = await makeProduct('Atún')
    const viaje = await makeList('Para el viaje', [atun])

    renderSection(atun)

    const membership = await screen.findByRole('link', { name: 'Para el viaje' })
    expect(membership).toHaveAttribute('href', `/lists/${viaje}`)

    await user.click(screen.getByRole('button', { name: 'Quitar de Para el viaje' }))

    await waitFor(async () => expect((await db.lists.get(viaje))?.productIds).toEqual([]))
    expect(await screen.findByText('Este producto no está en ninguna lista.')).toBeInTheDocument()
  })

  it('adds the product to another list from the select', async () => {
    const user = userEvent.setup()
    const atun = await makeProduct('Atún')
    const viaje = await makeList('Para el viaje', [atun])
    const viernes = await makeList('Viernes')

    renderSection(atun)

    await user.selectOptions(await screen.findByLabelText('Agregar a una lista'), String(viernes))
    await user.click(screen.getByRole('button', { name: 'Agregar' }))

    await screen.findByRole('link', { name: 'Viernes' })
    await waitFor(async () => {
      expect((await db.lists.get(viaje))?.productIds).toEqual([atun])
      expect((await db.lists.get(viernes))?.productIds).toEqual([atun])
    })
  })
})
