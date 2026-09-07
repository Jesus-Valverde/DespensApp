import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ListsScreen } from './ListsScreen'
import { db } from '../../db/db'

beforeEach(async () => {
  await Promise.all([db.lists.clear(), db.products.clear()])
})

function renderScreen() {
  render(
    <MemoryRouter initialEntries={['/lists']}>
      <Routes>
        <Route path="/lists" element={<ListsScreen />} />
        <Route path="/lists/:id" element={<p>DETALLE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ListsScreen', () => {
  it('rejects an empty title with a Spanish message (spec: reject empty list title)', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.click(await screen.findByRole('button', { name: 'Crear lista' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El nombre de la lista es obligatorio')
    expect(await db.lists.count()).toBe(0)
  })

  it('creates a list that appears with zero products (spec: create list)', async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.type(await screen.findByLabelText('Nombre de la lista'), 'Para el viaje')
    await user.click(screen.getByRole('button', { name: 'Crear lista' }))

    const item = await screen.findByRole('link', { name: /Para el viaje/ })
    expect(item).toBeInTheDocument()
    expect(item).toHaveTextContent('0 productos')
  })

  it('shows the empty state when there are no lists', async () => {
    renderScreen()

    expect(await screen.findByText('Aún no tienes listas.')).toBeInTheDocument()
  })
})
