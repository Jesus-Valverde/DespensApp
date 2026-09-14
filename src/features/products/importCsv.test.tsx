import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ImportCsvModal } from './ImportCsvModal'
import { parseCatalogCsv } from './importCsv'
import { db } from '../../db/db'
import type { Product } from '../../db/types'

const SAMPLE = [
  'Nombre,Marca,Modelo,Contenido,Unidad,Familia,Área,Descripción,Stock actual,Stock mínimo,Stock máximo,Ubicación,Precio referencia,Frecuencia',
  'Leche,Lala,100 Entera,1,L,Lácteo,Refri,,6,2,12,Refri,28.00,Semanal',
  'Atún,Dolores,3 pack,3,pza,Enlatados,Alacena,,,,,,,',
].join('\r\n')

const INVALID = [
  'Nombre,Contenido,Unidad,Stock actual,Precio referencia,Frecuencia',
  ',1,L,0,10,Semanal', // row 2: missing name
  'Café,abc,L,1,10,Semanal', // row 3: bad contenido
  'Café,1,galón,1,10,Semanal', // row 4: bad unidad
  'Café,1,L,-2,10,Semanal', // row 5: bad stock
  'Café,1,L,1,-5,Semanal', // row 6: bad price
  'Café,1,L,1,10,Diario', // row 7: bad frecuencia
].join('\r\n')

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.suppliers.clear(), db.carts.clear(), db.movements.clear()])
})

function renderModal() {
  render(
    <MemoryRouter>
      <ImportCsvModal onClose={() => {}} />
    </MemoryRouter>,
  )
}

async function upload(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = document.querySelector('input[type="file"]')! as HTMLElement
  await user.upload(input, new File([text], 'plantilla.csv', { type: 'text/csv' }))
}

describe('parseCatalogCsv', () => {
  it('parses valid rows into product drafts composing contenido + unidad', () => {
    const { rows, errors } = parseCatalogCsv(SAMPLE)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      title: 'Leche',
      brand: 'Lala',
      contentSize: '1 L',
      family: 'Lácteo',
      area: 'Refri',
      stock: { current: 6, min: 2, max: 12, location: 'Refri' },
      purchase: { originalPrice: 2800, period: 'semanal' },
    })
    expect(rows[1]).toMatchObject({
      title: 'Atún',
      contentSize: '3 pza',
      stock: { current: 0, min: null, max: null },
    })
  })

  it('reports one error per problem with the file row number', () => {
    const { rows, errors } = parseCatalogCsv(INVALID)
    expect(rows).toEqual([])
    expect(errors).toEqual([
      { row: 2, message: 'falta el Nombre' },
      { row: 3, message: 'Contenido debe ser un número mayor a 0' },
      { row: 4, message: 'Unidad no válida (usa L, ml, g, kg, pza o paq)' },
      { row: 5, message: 'Stock actual inválido' },
      { row: 6, message: 'Precio referencia inválido' },
      { row: 7, message: 'Frecuencia no válida (Semanal, Quincenal o Mensual)' },
    ])
  })

  it('accepts semicolon separated files (Spanish Excel)', () => {
    const text = 'Nombre;Marca;Contenido;Unidad\nLeche;Lala;1;L'
    const { rows, errors } = parseCatalogCsv(text)
    expect(errors).toEqual([])
    expect(rows[0]).toMatchObject({ title: 'Leche', brand: 'Lala', contentSize: '1 L' })
  })
})

describe('ImportCsvModal', () => {
  it('imports valid rows creating products with stock and purchase info', async () => {
    const user = userEvent.setup()
    renderModal()
    await upload(user, SAMPLE)

    expect(await screen.findByText('2 productos listos para importar')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Importar 2 productos' }))

    expect(await screen.findByText('Se importaron 2 productos.')).toBeInTheDocument()
    const leche = await db.products.where('title').equals('Leche').first()
    expect(leche).toMatchObject({ contentSize: '1 L', stock: { current: 6, min: 2, max: 12 } })
    expect(leche?.purchase.originalPrice).toBe(2800)
    expect(leche?.purchase.period).toBe('semanal')
    expect(await db.products.where('title').equals('Atún').count()).toBe(1)
  })

  it('shows per-row errors and imports nothing when every row is invalid', async () => {
    const user = userEvent.setup()
    renderModal()
    await upload(user, INVALID)

    expect(await screen.findByText('No se encontró ninguna fila válida.')).toBeInTheDocument()
    expect(screen.getByText('Fila 2: falta el Nombre')).toBeInTheDocument()
    const importButton = screen.getByRole('button', { name: /Importar/ })
    expect(importButton).toBeDisabled()
    expect(await db.products.count()).toBe(0)
  })

  it('skips products that already exist with the same name, brand and model', async () => {
    await db.products.add({
      title: 'Leche',
      brand: 'Lala',
      model: '100 Entera',
      customProps: [],
      stock: { current: 3, min: null, max: null },
      purchase: { secondarySupplierIds: [], period: null, links: [] },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    } as Product)

    const user = userEvent.setup()
    renderModal()
    await upload(user, SAMPLE)

    await user.click(await screen.findByRole('button', { name: 'Importar 2 productos' }))

    expect(await screen.findByText(/1 omitido por duplicado/)).toBeInTheDocument()
    expect(await db.products.where('title').equals('Leche').count()).toBe(1)
    expect(await db.products.where('title').equals('Atún').count()).toBe(1)
  })
})

describe('ImportCsvModal wiring', () => {
  it('calls onClose on Cancelar', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ImportCsvModal onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
