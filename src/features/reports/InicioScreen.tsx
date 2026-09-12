import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { formatDate, isDue } from '../../lib/dates'
import { outOfStock, upcomingPurchases } from './api'
import type { MovementType } from '../../db/types'

const MAX_ITEMS = 5

const MOVEMENT_LABEL: Record<MovementType, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
}

function describeMovement(type: MovementType, delta: number, resultingQty: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${MOVEMENT_LABEL[type]} ${sign}${delta} → ${resultingQty}`
}

/** / — the Inicio dashboard: quick metrics, the on-screen reports ("Faltantes",
 * "Stock bajo", "Próximas compras") and recent movements (Stitch design). */
export function InicioScreen() {
  const products = useLiveQuery(() => db.products.toArray(), []) ?? []
  const activeCarts =
    useLiveQuery(() => db.carts.where('status').equals('active').count(), []) ?? 0
  const listsCount = useLiveQuery(() => db.lists.count(), []) ?? 0
  const movements =
    useLiveQuery(async () => {
      const [all, prods] = await Promise.all([db.movements.toArray(), db.products.toArray()])
      const titles = new Map(prods.map((p) => [p.id!, p.title]))
      return all
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, MAX_ITEMS)
        .map((m) => ({ ...m, productTitle: titles.get(m.productId) ?? 'Producto eliminado' }))
    }, []) ?? []

  const out = outOfStock(products)
  // Presentational split of the same out-of-stock set: agotado vs por agotarse.
  const faltantes = out.filter(({ product }) => product.stock.current === 0)
  const stockBajo = out.filter(({ product }) => product.stock.current > 0)
  const proximas = upcomingPurchases(products)

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Inicio</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            Control de despensa e inventario
          </p>
        </div>
      </div>

      {/* Quick metrics */}
      <nav aria-label="Resumen" className="mt-5 grid grid-cols-3 gap-3">
        <Link
          to="/despensa/catalogo"
          className="pressable group rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition duration-200 hover:border-blue-300"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 4.27 9 5.15" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.3 7 8.7 5 8.7-5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
              </svg>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total
            </span>
          </div>
          <div className="text-2xl font-black leading-none tracking-tight text-slate-900">
            {products.length}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-700">Productos</div>
          <div className="truncate text-[11px] text-slate-400">en catálogo</div>
        </Link>

        <Link
          to="/compras/carritos"
          className="pressable group rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition duration-200 hover:border-amber-300"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <circle cx="8" cy="21" r="1" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="19" cy="21" r="1" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Activos
            </span>
          </div>
          <div className="text-2xl font-black leading-none tracking-tight text-slate-900">
            {activeCarts}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-700">Carritos</div>
          <div className="truncate text-[11px] text-slate-400">activos</div>
        </Link>

        <Link
          to="/compras/listas"
          className="pressable group rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition duration-200 hover:border-indigo-300"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 14 2 2 4-4" />
              </svg>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Base
            </span>
          </div>
          <div className="text-2xl font-black leading-none tracking-tight text-slate-900">
            {listsCount}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-700">Listas</div>
          <div className="truncate text-[11px] text-slate-400">guardadas</div>
        </Link>
      </nav>

      {/* Status reports */}
      <section aria-label="Estados del inventario" className="mt-6 space-y-4">
        {/* Faltantes (sin stock) */}
        <section
          aria-label="Faltantes"
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
        >
          <span className="absolute bottom-0 left-0 top-0 w-1.5 bg-amber-400" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 pl-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Faltantes
              </h2>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                {faltantes.length}
              </span>
            </div>
            <Link
              to="/despensa/stock"
              className="pressable flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Revisar
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
          {faltantes.length > 0 ? (
            <ul className="space-y-2 pb-1 pl-1 pt-3">
              {faltantes.slice(0, MAX_ITEMS).map(({ product, shortfall }) => (
                <li key={product.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link to={`/products/${product.id}`} className="font-medium">
                    {product.title}
                  </Link>
                  <span className="font-semibold text-red-600">Faltan {shortfall}</span>
                </li>
              ))}
              {faltantes.length > MAX_ITEMS && (
                <li className="text-xs text-slate-400">y {faltantes.length - MAX_ITEMS} más…</li>
              )}
            </ul>
          ) : (
            <div className="flex items-start gap-3.5 pb-1 pl-1 pt-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50/80 text-amber-500">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-semibold text-slate-800">Sin productos en falta.</p>
                <p className="text-xs leading-relaxed text-slate-400">
                  Tu despensa está al día. No hay productos agotados marcados para reposición
                  inmediata.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Stock bajo (por agotarse) */}
        <section
          aria-label="Stock bajo"
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
        >
          <span className="absolute bottom-0 left-0 top-0 w-1.5 bg-amber-400" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 pl-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Stock bajo
              </h2>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                {stockBajo.length}
              </span>
            </div>
            <Link
              to="/despensa/stock"
              className="pressable flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Revisar
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
          {stockBajo.length > 0 ? (
            <ul className="space-y-2 pb-1 pl-1 pt-3">
              {stockBajo.slice(0, MAX_ITEMS).map(({ product }) => (
                <li key={product.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link to={`/products/${product.id}`} className="font-medium">
                    {product.title}
                  </Link>
                  <span className="text-xs font-semibold text-amber-600">
                    Quedan {product.stock.current} · mín {product.stock.min}
                  </span>
                </li>
              ))}
              {stockBajo.length > MAX_ITEMS && (
                <li className="text-xs text-slate-400">y {stockBajo.length - MAX_ITEMS} más…</li>
              )}
            </ul>
          ) : (
            <div className="flex items-start gap-3.5 pb-1 pl-1 pt-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" x2="12" y1="9" y2="13" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" x2="12.01" y1="17" y2="17" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-semibold text-slate-800">Sin alertas de stock bajo.</p>
                <p className="text-xs leading-relaxed text-slate-400">
                  Tu inventario tiene niveles óptimos. Te avisaremos cuando un producto esté por
                  agotarse.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Próximas compras */}
        <section
          aria-label="Próximas compras"
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
        >
          <span className="absolute bottom-0 left-0 top-0 w-1.5 bg-blue-500" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 pl-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Próximas compras
              </h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                {proximas.length}
              </span>
            </div>
            <Link
              to="/compras/carritos"
              className="pressable flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Programar
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
          {proximas.length > 0 ? (
            <ul className="space-y-2 pb-1 pl-1 pt-3">
              {proximas.slice(0, MAX_ITEMS).map((product) => {
                const next = product.purchase.nextPurchaseDate!
                return (
                  <li key={product.id} className="flex items-center justify-between gap-2 text-sm">
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
              {proximas.length > MAX_ITEMS && (
                <li className="text-xs text-slate-400">y {proximas.length - MAX_ITEMS} más…</li>
              )}
            </ul>
          ) : (
            <div className="flex items-start gap-3.5 pb-1 pl-1 pt-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                  <line x1="16" x2="16" y1="2" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="8" x2="8" y1="2" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="3" x2="21" y1="10" y2="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h.01M12 14h.01M16 14h.01" />
                </svg>
              </span>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-semibold text-slate-800">Sin compras programadas.</p>
                <p className="text-xs leading-relaxed text-slate-400">
                  Planifica tu siguiente visita al supermercado o genera un carrito automático desde
                  tus listas.
                </p>
              </div>
            </div>
          )}
        </section>
      </section>

      {/* Quick action */}
      <div className="pt-5">
        <Link
          to="/products/new"
          className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Añadir producto
        </Link>
      </div>

      {/* Recent movements */}
      <section aria-label="Historial de movimientos" className="space-y-3 pt-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Historial de movimientos
        </h2>
        {movements.length > 0 ? (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{m.productTitle}</p>
                  <p className="text-xs text-slate-400">
                    {describeMovement(m.type, m.delta, m.resultingQty)}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-slate-400">
                  {new Date(m.date).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-50 text-emerald-700">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm font-semibold text-slate-800">Sin movimientos recientes</p>
              <p className="text-xs leading-relaxed text-slate-400">
                Aquí verás los ingresos, egresos y cambios de inventario o compras realizadas.
              </p>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}
