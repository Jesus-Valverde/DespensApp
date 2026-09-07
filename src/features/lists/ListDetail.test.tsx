import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ListDetail } from './ListDetail'
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

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lists" element={<p>LISTAS</p>} />
        <Route path="/lists/:id" element={<ListDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ListDetail', () => {
  it('rejects duplicate membership with a Spanish message (spec: reject duplicate membership)', async () => {
    const user = userEvent.setup()
    const atun = await makeProduct('Atún')
    const listId = await makeList('Para el viaje', [atun])

    renderAt(`/lists/${listId}`)
    await screen.findByRole('heading', { level: 1, name: 'Para el viaje' })

    await user.selectOptions(screen.getByLabelText('Producto'), String(atun))
    await user.click(screen.getByRole('button', { name: 'Agregar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El producto ya está en la lista')
    expect((await db.lists.get(listId))?.productIds).toEqual([atun])
  })

  it('adds and removes products from the list', async () => {
    const user = userEvent.setup()
    const atun = await makeProduct('Atún')
    const pan = await makeProduct('Pan')
    const listId = await makeList('Para el viaje', [atun])

    renderAt(`/lists/${listId}`)
    expect(await screen.findByRole('link', { name: 'Atún' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Producto'), String(pan))
    await user.click(screen.getByRole('button', { name: 'Agregar' }))

    await screen.findByRole('link', { name: 'Pan' })
    await waitFor(async () => expect((await db.lists.get(listId))?.productIds).toEqual([atun, pan]))

    await user.click(screen.getAllByRole('button', { name: 'Quitar' })[0])

    await waitFor(async () => expect((await db.lists.get(listId))?.productIds).toEqual([pan]))
    expect(await db.products.count()).toBe(2)
  })

  it('deletes the list after confirmation while the products remain (spec: delete list preserves products)', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    const atun = await makeProduct('Atún')
    const listId = await makeList('Para el viaje', [atun])

    renderAt(`/lists/${listId}`)
    await user.click(await screen.findByRole('button', { name: 'Eliminar lista' }))

    expect(await screen.findByText('LISTAS')).toBeInTheDocument() // navigated back
    await waitFor(async () => expect(await db.lists.count()).toBe(0))
    expect(await db.products.count()).toBe(1)
  })
})
