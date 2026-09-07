import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { CartForm } from './CartForm'
import { db } from '../../db/db'

beforeEach(async () => {
  await db.carts.clear()
})

function renderForm() {
  render(
    <MemoryRouter initialEntries={['/carts/new']}>
      <Routes>
        <Route path="/carts/new" element={<CartForm />} />
        <Route path="/carts/:id" element={<p>DETALLE</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CartForm', () => {
  it('rejects a blank name with the Spanish validation message and stores nothing', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('El nombre del carrito es obligatorio')
    expect(await db.carts.count()).toBe(0)
  })

  it('creates an active manual cart and navigates to its detail', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Nombre'), 'Súper de la semana')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('DETALLE')).toBeInTheDocument()
    const [cart] = await db.carts.toArray()
    expect(cart).toMatchObject({ name: 'Súper de la semana', status: 'active', origin: 'manual', items: [] })
  })
})
