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

  it('catalog data modal chains to the CSV import and template help modals', async () => {
    renderLayout()

    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Datos del catálogo' }))
    const dialog = await screen.findByRole('dialog', { name: 'Datos del catálogo' })
    expect(within(dialog).getByText('Importar CSV')).toBeInTheDocument()
    expect(within(dialog).getByText('Cómo llenar la plantilla')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: /Importar CSV/ }))
    expect(
      await screen.findByRole('dialog', { name: 'Importar productos desde CSV' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: 'Datos del catálogo' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    openMenu()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Datos del catálogo' }))
    const dialog2 = await screen.findByRole('dialog', { name: 'Datos del catálogo' })
    fireEvent.click(within(dialog2).getByRole('button', { name: /Cómo llenar la plantilla/ }))
    const help = await screen.findByRole('dialog', { name: 'Cómo importar tu catálogo' })
    expect(within(help).getByRole('link', { name: /Descargar plantilla/ })).toHaveAttribute(
      'href',
      '/plantilla-catalogo.csv',
    )
  })
})
