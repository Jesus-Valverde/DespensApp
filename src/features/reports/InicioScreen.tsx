import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { formatDate } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import { ListSkeleton } from '../../lib/skeleton'
import type { Product } from '../../db/types'
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

type StockBucket = { label: string; count: number; color: string; text: string }

function stockBuckets(products: Product[]): StockBucket[] {
  const sinStock = products.filter((p) => p.stock.current === 0).length
  const bajo = products.filter(
    (p) => p.stock.current > 0 && p.stock.min != null && p.stock.current <= p.stock.min,
  ).length
  const enInventario = products.length - sinStock - bajo
  const total = products.length || 1
  const pct = (n: number) => `${Math.round((n / total) * 100)}%`
  return [
    { label: 'En inventario', count: enInventario, color: '#10b981', text: pct(enInventario) },
    { label: 'Stock bajo', count: bajo, color: '#f59e0b', text: pct(bajo) },
    { label: 'Sin stock', count: sinStock, color: '#dc2626', text: pct(sinStock) },
  ]
}

/** The next active cart: earliest estimated date first, then earliest created. */
function nextCart(carts: { estimatedDate?: string; createdAt: string }[]) {
  return [...carts].sort((a, b) => (a.estimatedDate ?? '9999').localeCompare(b.estimatedDate ?? '9999') || a.createdAt.localeCompare(b.createdAt))[0]
}

/** / — the Inicio dashboard: the stock KPI card, the next-restock and
 * estimated-purchase tiles, and recent movements (design contract, block 1). */
export function InicioScreen() {
  const productsQuery = useLiveQuery(() => db.products.toArray(), [])
  const products = productsQuery ?? []
  const activeCartsQuery = useLiveQuery(() => db.carts.where('status').equals('active').toArray(), [])
  const activeCarts = activeCartsQuery ?? []
  const movementsQuery = useLiveQuery(async () => {
    const [all, prods] = await Promise.all([db.movements.toArray(), db.products.toArray()])
    const titles = new Map(prods.map((p) => [p.id!, p.title]))
    return all
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MAX_ITEMS)
      .map((m) => ({ ...m, productTitle: titles.get(m.productId) ?? 'Producto eliminado' }))
  }, [])
  const movements = movementsQuery ?? []
  // Loading: show the skeleton instead of flashing zero metrics and empty states.
  const loading = productsQuery === undefined || movementsQuery === undefined || activeCartsQuery === undefined

  const upcoming = nextCart(activeCarts)
  const upcomingTotal = upcoming
    ? upcoming.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
    : null

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Inicio</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Control de despensa e inventario
          </p>
        </div>
      </div>

      {loading ? (
        <ListSkeleton className="mt-6" />
      ) : products.length === 0 ? (
        /* First run: the pantry is empty — one welcome card instead of a wall
            of zero-state sections; the add action leads the screen. */
        <section className="relative mt-6 flex flex-col items-center overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 text-center shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-50 opacity-60 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-indigo-50 opacity-60 blur-2xl" />
          <div className="animate-subtle-float relative mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-50 via-indigo-50/60 to-amber-50 shadow-inner">
            <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 4.27 9 5.15" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m3.3 7 8.7 5 8.7-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V12" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-bold text-slate-800">Empieza tu despensa</h2>
          <p className="mb-6 max-w-xs text-sm leading-relaxed text-slate-500 mx-auto">
            Agrega tu primer producto y aquí verás tus faltantes, alertas de stock y próximas
            compras.
          </p>
          <Link
            to="/products/new"
            className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Añadir producto
          </Link>
        </section>
      ) : (
        <>
          {/* Stock KPI card */}
          <section
            aria-label="Stock de tus productos"
            className="mt-5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
          >
            <h2 className="text-sm font-bold text-slate-800">Stock de tus productos</h2>
            <div className="mt-3 flex h-2.5 gap-0.5" aria-hidden="true">
              {stockBuckets(products).map(
                (b) =>
                  b.count > 0 && (
                    <div
                      key={b.label}
                      className="h-2.5 rounded-full"
                      style={{ backgroundColor: b.color, flexGrow: b.count }}
                    />
                  ),
              )}
            {products.length === 0 && <div className="h-2.5 flex-1 rounded-full bg-slate-200" />}
          </div>
          <ul className="mt-3 space-y-2">
            {stockBuckets(products).map((b) => (
              <li key={b.label} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: b.color }}
                  aria-hidden="true"
                />
                <span className="font-medium text-slate-800">{b.label}</span>
                <span className="ml-auto font-bold text-slate-900">{b.count}</span>
                <span className="w-10 text-right text-xs text-slate-500">{b.text}</span>
              </li>
            ))}
          </ul>
        </section>

          {/* Next restock + estimated purchase */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link
              to="/compras/carritos"
              className="pressable rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition hover:border-blue-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                </svg>
              </span>
              <p className="mt-2 text-lg font-black leading-none tracking-tight text-slate-900">
                {upcoming?.estimatedDate ? formatDate(upcoming.estimatedDate) : '—'}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Próxima reposición</p>
            </Link>
            <Link
              to="/compras/carritos"
              className="pressable rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition hover:border-emerald-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <circle cx="8" cy="21" r="1" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="19" cy="21" r="1" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </span>
              <p className="mt-2 text-lg font-black leading-none tracking-tight text-slate-900">
                {upcomingTotal != null ? formatMoney(upcomingTotal).replace(' MXN', '') : '—'}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Compra estimada</p>
            </Link>
          </div>

          {/* Recent movements */}
          <section aria-label="Historial de movimientos" className="space-y-3 pt-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Historial de movimientos
            </h2>
            {movements.length > 0 ? (
              <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                {movements.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{m.productTitle}</p>
                      <p className="text-xs text-slate-500">
                        {describeMovement(m.type, m.delta, m.resultingQty)}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-slate-500">
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
                  <p className="text-xs leading-relaxed text-slate-500">
                    Aquí verás los ingresos, egresos y cambios de inventario o compras realizadas.
                  </p>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}
