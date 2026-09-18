import { describe, it, expect, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Layout } from './Layout'
import { db } from '../db/db'

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.carts.clear(), db.lists.clear(), db.movements.clear()])
})

function renderLayout() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Layout>
        <p>Contenido</p>
      </Layout>
    </MemoryRouter>,
  )
}

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Más opciones' }))
  return screen.getByRole('menu', { name: 'Opciones de datos' })
}

describe('Header data menu', () => {
  it('opens a dropdown next to the bell with the two data entries', () => {
    renderLayout()

    const menu = openMenu()
    expect(within(menu).getByRole('menuitem', { name: 'Respaldo de datos' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Datos del catálogo' })).toBeInTheDocument()
  })

  it('opens the backup modal from the menu', async () => {
    renderLayout()

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Respaldo de datos' }))

    expect(await screen.findByRole('dialog', { name: 'Respaldo de datos' })).toBeInTheDocument()
  })

  it('catalog data modal offers the CSV import and inline template help', async () => {
    renderLayout()

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Datos del catálogo' }))
    const dialog = await screen.findByRole('dialog', { name: 'Datos del catálogo' })
    expect(within(dialog).getByRole('button', { name: 'plantilla-catalogo.xlsx' })).toBeInTheDocument()
    expect(within(dialog).getByText(/Unidades válidas/)).toBeInTheDocument()
    expect(within(dialog).getByText('L')).toBeInTheDocument()
    expect(within(dialog).getByText('Paquete')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Exportar catálogo' })).toBeInTheDocument()

    // Import unfolds the dropzone inline, no second modal
    fireEvent.click(within(dialog).getByRole('button', { name: 'Importar catálogo' }))
    expect(await within(dialog).findByText(/Agrega o arrastra tu archivo/)).toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: 'Importar productos desde CSV' }),
    ).not.toBeInTheDocument()
  })
})
