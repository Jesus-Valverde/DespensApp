import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { useObjectUrl } from '../../lib/useObjectUrl'
import { StockSection } from '../inventory/StockSection'
import { MovementForm } from '../inventory/MovementForm'
import { BitacoraList } from '../inventory/BitacoraList'
import { PurchaseSection } from '../purchase/PurchaseSection'
import { ListsSection } from '../lists/ListsSection'
import { deleteProduct, duplicateProduct } from './api'

export function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const productId = Number(id)
  const product = useLiveQuery(() => db.products.get(productId), [productId])
  const imageUrl = useObjectUrl(product?.image)
  const [error, setError] = useState('')

  if (!product) return <p className="mt-4 text-sm text-slate-500">Cargando…</p>

  // Capture the narrowed product so the handlers below keep the non-undefined type.
  const current = product

  async function handleDuplicate() {
    try {
      const newId = await duplicateProduct(current.id!)
      navigate(`/products/${newId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo duplicar el producto')
    }
  }

  async function handleDelete() {
    const message = `¿Eliminar "${current.title}"? Se borrarán su historial de movimientos y sus referencias en carritos y listas.`
    if (!window.confirm(message)) return
    try {
      await deleteProduct(current.id!)
      navigate('/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el producto')
    }
  }

  const datos: [string, string | undefined][] = [
    ['Marca', current.brand],
    ['Contenido', current.contentSize],
    ['Área', current.area],
    ['Modelo', current.model],
  ]
  const filledDatos = datos.filter(([, value]) => value)

  return (
    <section>
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {imageUrl ? (
        <img src={imageUrl} alt={product.title} className="h-40 w-40 rounded-lg object-cover" />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-400">
          Sin imagen
        </div>
      )}

      <h1 className="mt-4 text-xl font-semibold">{product.title}</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={`/products/${product.id}/edit`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          Editar
        </Link>
        <button
          type="button"
          onClick={handleDuplicate}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          Duplicar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600"
        >
          Eliminar
        </button>
      </div>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">Datos</h2>
      {filledDatos.length > 0 || product.customProps.length > 0 ? (
        <>
          {filledDatos.length > 0 && (
            <dl className="mt-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
              {filledDatos.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-0.5">
                  <dt className="text-slate-500">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {product.customProps.length > 0 && (
            <ul className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-white p-4 text-sm">
              {product.customProps.map((prop) => (
                <li key={prop.key}>
                  {prop.key}: {prop.value}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Sin datos adicionales.</p>
      )}

      <StockSection product={current} />
      <MovementForm productId={current.id!} />
      <BitacoraList productId={current.id!} />
      <PurchaseSection product={current} />
      <ListsSection productId={current.id!} />
    </section>
  )
}
