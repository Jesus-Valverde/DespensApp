import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as XLSX from 'xlsx'
import { CatalogDataModal } from './CatalogDataModal'
import { parseCatalogCsv, parseCatalogFile, buildCatalogTemplate, buildCatalogExport, CATALOG_COLUMNS } from './importCsv'
import { db } from '../../db/db'
import type { Product } from '../../db/types'

const SAMPLE = [
  'Nombre,Marca,Modelo,Contenido,Unidad,Familia,Área,Descripción,Stock actual,Stock mínimo,Stock máximo,Ubicación,Precio referencia,Frecuencia',
  'Leche,Lala,100 Entera,1,L,Lácteo,Refri,,6,2,12,Refri,28.00,Semanal',
  'Atún,Dolores,3 pack,3,pza,Enlatados,Alacena,,,,,,,',
].join('\r\n')

const SAMPLE_GRID = [
  CATALOG_COLUMNS,
  ['Leche', 'Lala', '100 Entera', '1', 'L', 'Lácteo', 'Refri', '', '6', '2', '12', 'Refri', '28.00', 'Semanal'],
  ['Atún', 'Dolores', '3 pack', '3', 'pza', 'Enlatados', 'Alacena', '', '', '', '', '', '', ''],
]

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
  await Promise.all([
    db.products.clear(),
    db.productDefs.clear(),
    db.suppliers.clear(),
    db.carts.clear(),
    db.movements.clear(),
  ])
})

function renderModal() {
  render(<CatalogDataModal onClose={() => {}} />)
}

function csvFile(text: string): File {
  return new File([text], 'plantilla.csv', { type: 'text/csv' })
}

function xlsxFile(rows: (string | number)[][]): File {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Catálogo')
  const data = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return new File([data], 'plantilla.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/** Open the inline import section and upload a file into its dropzone input. */
async function openAndUpload(user: ReturnType<typeof userEvent.setup>, file: File) {
  await user.click(screen.getByRole('button', { name: 'Importar catálogo' }))
  const input = document.querySelector('input[type="file"]')! as HTMLElement
  await user.upload(input, file)
}

describe('parseCatalogCsv', () => {
  it('parses valid rows into product drafts with content and unit split', () => {
    const { rows, errors } = parseCatalogCsv(SAMPLE)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      title: 'Leche',
      brand: 'Lala',
      content: '1',
      unit: 'L',
      family: 'Lácteo',
      area: 'Refri',
      stock: { current: 6, min: 2, max: 12, location: 'Refri' },
      purchase: { originalPrice: 2800, period: 'semanal' },
    })
    expect(rows[1]).toMatchObject({
      title: 'Atún',
      content: '3',
      unit: 'pza',
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
    expect(rows[0]).toMatchObject({ title: 'Leche', brand: 'Lala', content: '1', unit: 'L' })
  })
})

describe('parseCatalogFile', () => {
  it('reads .xlsx workbooks into the same validated drafts', async () => {
    const { rows, errors } = await parseCatalogFile(xlsxFile(SAMPLE_GRID))
    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      title: 'Leche',
      brand: 'Lala',
      content: '1',
      unit: 'L',
      stock: { current: 6, min: 2, max: 12, location: 'Refri' },
      purchase: { originalPrice: 2800, period: 'semanal' },
    })
    expect(rows[1]).toMatchObject({ title: 'Atún', content: '3', unit: 'pza' })
  })

  it('still reads plain .csv files', async () => {
    const { rows, errors } = await parseCatalogFile(csvFile(SAMPLE))
    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]?.title).toBe('Leche')
  })

  it('builds a template workbook with the catalog column contract', async () => {
    const workbook = await buildCatalogTemplate()
    const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets['Catálogo'], { header: 1 })
    expect(grid[0]).toEqual(CATALOG_COLUMNS)
    expect(grid).toHaveLength(3) // header + 2 example rows
  })

  it('exports every product as a template-format row that round-trips', async () => {
    await db.products.add({
      title: 'Leche',
      brand: 'Lala',
      model: '100 Entera',
      content: '1',
      unit: 'L',
      family: 'Lácteo',
      area: 'Refri',
      customProps: [],
      stock: { current: 6, min: 2, max: 12, location: 'Refri' },
      purchase: { originalPrice: 2800, period: 'semanal', secondarySupplierIds: [], links: [] },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    } as Product)
    await db.products.add({
      title: 'Sal',
      customProps: [],
      stock: { current: 3, min: null, max: null },
      purchase: { secondarySupplierIds: [], period: null, links: [] },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    } as Product)

    const workbook = await buildCatalogExport(await db.products.toArray())
    const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets['Catálogo'], { header: 1 })
    expect(grid[0]).toEqual(CATALOG_COLUMNS)
    expect(grid[1]).toEqual([
      'Leche', 'Lala', '100 Entera', '1', 'L', 'Lácteo', 'Refri', '',
      '6', '2', '12', 'Refri', '28.00', 'Semanal',
    ])
    expect(grid[2]).toEqual(['Sal', '', '', '', '', '', '', '', '3', '', '', '', '', ''])
    // The exported rows re-import as the same drafts
    const text = XLSX.utils.sheet_to_csv(workbook.Sheets['Catálogo'])
    const { rows, errors } = parseCatalogCsv(text)
    expect(errors).toEqual([])
    expect(rows[0]).toMatchObject({
      title: 'Leche',
      content: '1',
      unit: 'L',
      stock: { current: 6, min: 2, max: 12, location: 'Refri' },
      purchase: { originalPrice: 2800, period: 'semanal' },
    })
  })
})

describe('CatalogDataModal inline import', () => {
  it('unfolds the dropzone below the button and imports valid .xlsx rows', async () => {
    const user = userEvent.setup()
    renderModal()
    await openAndUpload(user, xlsxFile(SAMPLE_GRID))

    expect(await screen.findByText('2 productos listos para importar')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Importar 2 productos' }))

    expect(await screen.findByText('Se importaron 2 productos.')).toBeInTheDocument()
    const leche = await db.products.where('title').equals('Leche').first()
    expect(leche).toMatchObject({ content: '1', unit: 'L', stock: { current: 6, min: 2, max: 12 } })
    expect(leche?.purchase.originalPrice).toBe(2800)
    expect(leche?.purchase.period).toBe('semanal')
    expect(await db.products.where('title').equals('Atún').count()).toBe(1)
    // The import registers each product name as a def (props stay empty: the
    // template has no props column and must not clobber existing templates).
    const lecheDef = await db.productDefs.where('title').equals('Leche').first()
    expect(lecheDef).toMatchObject({ title: 'Leche', props: [] })
  })

  it('shows per-row errors and imports nothing when every row is invalid', async () => {
    const user = userEvent.setup()
    renderModal()
    await openAndUpload(user, csvFile(INVALID))

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
    await openAndUpload(user, xlsxFile(SAMPLE_GRID))

    await user.click(await screen.findByRole('button', { name: 'Importar 2 productos' }))

    expect(await screen.findByText(/1 omitido por duplicado/)).toBeInTheDocument()
    expect(await db.products.where('title').equals('Leche').count()).toBe(1)
    expect(await db.products.where('title').equals('Atún').count()).toBe(1)
  })

  it('Cancel collapses the import section back into the modal', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: 'Importar catálogo' }))
    expect(await screen.findByText(/Agrega o arrastra tu archivo/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByLabelText(/Agrega o arrastra/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importar catálogo' })).toBeInTheDocument()
  })
})
