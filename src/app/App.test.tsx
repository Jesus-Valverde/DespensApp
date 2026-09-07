import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'

const TABS = ['Inicio', 'Productos', 'Carritos', 'Listas', 'Ajustes']

describe('App shell', () => {
  it('renders the 5 Spanish bottom tabs', () => {
    render(<App />)
    for (const tab of TABS) {
      expect(screen.getByRole('link', { name: tab })).toBeInTheDocument()
    }
  })

  it('shows the Inicio placeholder on the root route', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument()
  })
})
