import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { App } from './App'

const TABS = ['Inicio', 'Despensa', 'Carritos', 'Listas', 'Proveedores']

describe('App shell', () => {
  it('renders the 5 Spanish bottom tabs', () => {
    render(<App />)
    // Scoped to the bottom nav: the Inicio dashboard also links to these sections.
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    for (const tab of TABS) {
      expect(within(nav).getByRole('link', { name: tab })).toBeInTheDocument()
    }
  })

  it('shows the Inicio dashboard on the root route', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument()
  })
})
