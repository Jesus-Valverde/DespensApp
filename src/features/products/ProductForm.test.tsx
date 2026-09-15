import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ProductForm } from './ProductForm'
import { db } from '../../db/db'
import { createProduct } from './api'

vi.mock('../../lib/image', () => ({
  downscaleImage: vi.fn(async (file: Blob) => new Blob([await file.arrayBuffer()], { type: 'image/jpeg' })),
}))

const originalCreate = URL.createObjectURL
const originalRevoke = URL.revokeObjectURL

beforeEach(async () => {
  await Promise.all([db.products.clear(), db.productDefs.clear()])
})

afterEach(() => {
  URL.createObjectURL = originalCreate
  URL.revokeObjectURL = originalRevoke
  vi.restoreAllMocks()
})

describe('ProductForm', () => {
  it('rejects an empty title with the Spanish validation message and stores nothing', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProductForm />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('El nombre del producto es obligatorio')
    expect(await db.products.count()).toBe(0)
  })

  it('rejects a custom property key that already exists on the product', async () => {
    const user = userEvent.setup()
    const id = await createProduct({
      title: 'Detergente',
      customProps: [{ key: 'Pagar con tarjeta', value: 'sí' }],
    })
    const existing = await db.products.get(id)
    if (!existing) throw new Error('seed product missing')

    render(
      <MemoryRouter>
        <ProductForm product={existing} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Agregar propiedad' }))
    const keyInputs = screen.getAllByLabelText('Propiedad')
    await user.type(keyInputs[keyInputs.length - 1], 'Pagar con tarjeta')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe la propiedad "Pagar con tarjeta"')
  })

  it('offers distinct existing areas in the area dropdown', async () => {
    const user = userEvent.setup()
    await createProduct({ title: 'Leche', area: 'Refri', customProps: [] })
    await createProduct({ title: 'Atún', area: 'Alacena', customProps: [] })
    await createProduct({ title: 'Café', area: 'Refri', customProps: [] })

    render(
      <MemoryRouter>
        <ProductForm />
      </MemoryRouter>,
    )

    const areaInput = screen.getByRole('combobox', { name: 'Área' })
    await user.click(areaInput)

    // Scope to the open listbox: the unit <select> also exposes <option>s.
    const listbox = await screen.findByRole('listbox')
    const options = within(listbox).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Alacena', 'Refri'])
  })

  it('loads the name template props when picking an existing name', async () => {
    const user = userEvent.setup()
    await createProduct({
      title: 'Leche',
      customProps: [{ key: 'Sabor', value: 'Entera' }],
    })

    render(
      <MemoryRouter>
        <ProductForm />
      </MemoryRouter>,
    )

    const nameInput = screen.getByRole('combobox', { name: 'Nombre del producto' })
    await user.click(nameInput)
    await user.click(await screen.findByRole('option', { name: 'Leche' }))

    expect(nameInput).toHaveValue('Leche')
    expect(await screen.findByDisplayValue('Entera')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Propiedad')[0]).toHaveValue('Sabor')
  })

  it('shows the id chip and back button in the edit form', async () => {
    const id = await createProduct({ title: 'Leche', customProps: [] })
    const existing = await db.products.get(id)
    if (!existing) throw new Error('seed product missing')

    render(
      <MemoryRouter>
        <ProductForm product={existing} />
      </MemoryRouter>,
    )

    expect(screen.getByText(`Id: #${id}`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver a productos' })).toBeInTheDocument()
  })

  it('offers the canonical unit options in the unit select', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProductForm />
      </MemoryRouter>,
    )

    const unit = screen.getByRole('combobox', { name: 'Unidad' }) as HTMLSelectElement
    const values = [...unit.options].map((option) => option.value)
    expect(values).toEqual(['', 'L', 'ml', 'g', 'kg', 'pza', 'paq'])
    await user.selectOptions(unit, 'ml')
    expect(unit).toHaveValue('ml')
  })

  it('shows a help tip when clicking a field help marker', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProductForm />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ayuda: Área' }))

    expect(screen.getByRole('note')).toHaveTextContent('Categoría de la despensa')
  })

  it('accepts a dropped image file', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:dropped-1')
    URL.revokeObjectURL = vi.fn()
    render(
      <MemoryRouter>
        <ProductForm />
      </MemoryRouter>,
    )

    const file = new File(['dropped-photo'], 'foto.png', { type: 'image/png' })
    const dropzone = screen.getByLabelText(/Toca o arrastra para agregar imagen/)
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    const img = await screen.findByRole('img')
    expect(img).toHaveAttribute('src', 'blob:dropped-1')
    const { downscaleImage } = await import('../../lib/image')
    expect(downscaleImage).toHaveBeenCalledWith(expect.any(Blob))
  })

  it('downscales a picked image and shows it with a remove button', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview-1')
    URL.revokeObjectURL = vi.fn()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProductForm />
      </MemoryRouter>,
    )

    const file = new File(['huge-photo'], 'foto.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText(/Toca o arrastra para agregar imagen/), file)

    const img = await screen.findByRole('img')
    expect(img).toHaveAttribute('src', 'blob:preview-1')
    const { downscaleImage } = await import('../../lib/image')
    expect(downscaleImage).toHaveBeenCalledWith(expect.any(Blob))
    expect(screen.getByRole('button', { name: 'Quitar imagen' })).toBeInTheDocument()
  })

  it('saves a picked icon and tone from the icon picker', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProductForm />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Nombre del producto'), 'Leche entera')
    await user.click(screen.getByRole('button', { name: 'Ícono' }))
    await user.type(screen.getByLabelText('Buscar ícono'), 'láct')
    await user.click(screen.getByRole('button', { name: 'Lácteos' }))
    await user.click(screen.getByRole('button', { name: 'Verde menta' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(async () => expect(await db.products.count()).toBe(1))
    expect(await db.products.toCollection().first()).toMatchObject({
      title: 'Leche entera',
      iconKey: 'lacteos',
      iconTone: 'menta',
    })
  })

  it('filters the icon grid by search text', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProductForm />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Ícono' }))
    await user.type(screen.getByLabelText('Buscar ícono'), 'pan')
    expect(screen.getByRole('button', { name: 'Pan' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lácteos' })).not.toBeInTheDocument()
  })
})
