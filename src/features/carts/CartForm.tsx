import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { createCart } from './api'

/** /carts/new — manual cart creation from the FAB. */
export function CartForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const id = await createCart({ name })
      navigate(`/carts/${id}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el carrito')
    }
  }

  return (
    <section>
      <h1 className="text-xl font-semibold">Nuevo carrito</h1>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div>
          <label htmlFor="cart-name" className="font-medium">
            Nombre
          </label>
          <input
            id="cart-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Súper de la semana"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Guardar
        </button>
      </form>
    </section>
  )
}
