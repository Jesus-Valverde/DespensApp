import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { formatDate, isDue } from '../../lib/dates'
import { outOfStock, upcomingPurchases } from './api'

/** / — the Inicio dashboard: the two on-screen reports ("Faltantes" and
 * "Próximas compras") plus quick links into the working sections. */
export function InicioScreen() {
  const products = useLiveQuery(() => db.products.toArray(), []) ?? []
  const activeCarts =
    useLiveQuery(() => db.carts.where('status').equals('active').count(), []) ?? 0

  const faltantes = outOfStock(products)
  const proximas = upcomingPurchases(products)

  return (
    <section>
      <h1 className="text-xl font-semibold">Inicio</h1>

      <nav aria-label="Accesos rápidos" className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <Link
          to="/products"
          className="rounded-lg border border-slate-200 bg-white p-3 active:bg-slate-50"
        >
          <span className="block font-medium">Productos</span>
          <span className="text-slate-500">{products.length} en catálogo</span>
        </Link>
        <Link
          to="/carts"
          className="rounded-lg border border-slate-200 bg-white p-3 active:bg-slate-50"
        >
          <span className="block font-medium">Carritos</span>
          <span className="text-slate-500">{activeCarts} activos</span>
        </Link>
        <Link
          to="/lists"
          className="rounded-lg border border-slate-200 bg-white p-3 active:bg-slate-50"
        >
          <span className="block font-medium">Listas</span>
        </Link>
      </nav>

      <section aria-label="Faltantes" className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Faltantes ({faltantes.length})
        </h2>
        {faltantes.length > 0 ? (
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {faltantes.map(({ product, shortfall }) => (
              <li key={product.id} className="flex items-center justify-between gap-2 py-2">
                <Link to={`/products/${product.id}`} className="font-medium">
                  {product.title}
                </Link>
                <span className="text-red-600">
                  {shortfall === 0 ? 'En mínimo' : `Faltan ${shortfall}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Sin productos en falta.</p>
        )}
      </section>

      <section
        aria-label="Próximas compras"
        className="mt-4 rounded-lg border border-slate-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Próximas compras ({proximas.length})
        </h2>
        {proximas.length > 0 ? (
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {proximas.map((product) => {
              const next = product.purchase.nextPurchaseDate!
              return (
                <li key={product.id} className="flex items-center justify-between gap-2 py-2">
                  <Link to={`/products/${product.id}`} className="font-medium">
                    {product.title}
                  </Link>
                  <span className="flex items-center gap-2 text-slate-500">
                    {isDue(next) && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                        Vencida
                      </span>
                    )}
                    {formatDate(next)}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Sin compras programadas.</p>
        )}
      </section>
    </section>
  )
}
