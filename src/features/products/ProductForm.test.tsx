import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
  await db.products.clear()
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

  it('offers distinct existing areas in the area datalist', async () => {
    await createProduct({ title: 'Leche', area: 'Refri', customProps: [] })
    await createProduct({ title: 'Atún', area: 'Alacena', customProps: [] })
    await createProduct({ title: 'Café', area: 'Refri', customProps: [] })

    const { container } = render(
      <MemoryRouter>
        <ProductForm />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(container.querySelectorAll('#product-areas option')).toHaveLength(2),
    )
    const values = [...container.querySelectorAll<HTMLOptionElement>('#product-areas option')].map(
      (option) => option.value,
    )
    expect(values).toEqual(['Alacena', 'Refri'])
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
    await user.upload(screen.getByLabelText(/Toca para agregar imagen/), file)

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
