import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Supplier } from '../../db/types'
import { createSupplier, updateSupplier, deleteSupplier, countProductsReferencing } from './api'

const EMPTY_FORM = { name: '', type: '', locations: '' }

function parseLocations(value: string): string[] {
  return value
    .split(',')
    .map((location) => location.trim())
    .filter((location) => location.length > 0)
}

export function SuppliersScreen() {
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []) ?? []
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const editing = editingId != null

  function setField(field: keyof typeof EMPTY_FORM) {
    return (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const input = {
      name: form.name,
      type: form.type.trim() || undefined,
      locations: parseLocations(form.locations),
    }
    try {
      if (editingId != null) await updateSupplier(editingId, input)
      else await createSupplier(input)
      resetForm()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el proveedor')
    }
  }

  function startEdit(supplier: Supplier) {
    setEditingId(supplier.id ?? null)
    setForm({
      name: supplier.name,
      type: supplier.type ?? '',
      locations: supplier.locations.join(', '),
    })
    setError('')
  }

  async function handleDelete(supplier: Supplier) {
    try {
      const count = await countProductsReferencing(supplier.id!)
      const message =
        count > 0
          ? `${count} productos usan este proveedor; se quitará la referencia. ¿Eliminar proveedor?`
          : '¿Eliminar el proveedor?'
      if (!window.confirm(message)) return
      await deleteSupplier(supplier.id!)
      if (editingId === supplier.id) resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el proveedor')
    }
  }

  return (
    <section>
      <h1 className="text-xl font-semibold">Proveedores</h1>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label htmlFor="supplier-name" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="supplier-name"
            value={form.name}
            onChange={setField('name')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="supplier-type" className="text-sm font-medium">
            Tipo
          </label>
          <input
            id="supplier-type"
            value={form.type}
            onChange={setField('type')}
            placeholder="Supermercado, mayoreo, en línea…"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="supplier-locations" className="text-sm font-medium">
            Ubicaciones (separadas por comas)
          </label>
          <input
            id="supplier-locations"
            value={form.locations}
            onChange={setField('locations')}
            placeholder="Centro, Norte"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Guardar
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <ul className="mt-4 space-y-2">
        {suppliers.map((supplier) => (
          <li key={supplier.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{supplier.name}</p>
                {supplier.type && <p className="text-sm text-slate-500">{supplier.type}</p>}
                {supplier.locations.length > 0 && (
                  <p className="text-sm text-slate-500">{supplier.locations.join(', ')}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(supplier)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(supplier)}
                  className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
