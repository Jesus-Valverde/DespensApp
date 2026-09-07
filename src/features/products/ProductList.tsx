import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'

export function ProductList() {
  const products = useLiveQuery(() => db.products.orderBy('title').toArray(), []) ?? []

  return (
    <section>
      <h1 className="text-xl font-semibold">Productos</h1>

      {products.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
          Sin productos todavía. Toca el botón + para agregar el primero.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                to={`/products/${product.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 active:bg-slate-50"
              >
                <span className="font-medium">{product.title}</span>
                {(product.brand || product.contentSize || product.area) && (
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {[product.brand, product.contentSize, product.area].filter(Boolean).join(' · ')}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
