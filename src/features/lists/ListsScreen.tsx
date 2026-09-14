import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { List } from '../../db/types'
import { createList } from './api'

function listSubtitle(list: List): string {
  const count = list.productIds.length
  return count === 1 ? '1 producto' : `${count} productos`
}

/** /lists — named shopping lists with inline creation. */
export function ListsScreen() {
  const lists = useLiveQuery(() => db.lists.toArray(), []) ?? []
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  const ordered = [...lists].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await createList({ title })
      setTitle('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo crear la lista')
    }
  }

  return (
    <section>
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <label htmlFor="list-title" className="font-medium">
          Nombre de la lista
        </label>
        <input
          id="list-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Para el viaje"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
        {error && (
          <p role="alert" className="mt-2 text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Crear lista
        </button>
      </form>

      {ordered.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {ordered.map((list) => (
            <li key={list.id}>
              <Link
                to={`/lists/${list.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 active:bg-slate-50"
              >
                <span className="font-medium">{list.title}</span>
                <span className="mt-0.5 block text-sm text-slate-500">{listSubtitle(list)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          Aún no tienes listas.
        </p>
      )}
    </section>
  )
}
