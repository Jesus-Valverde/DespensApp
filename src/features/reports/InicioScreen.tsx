import { useState } from 'react'
import { Link } from 'react-router'
import { BackupModal } from '../../app/BackupModal'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarDays, PackageMinus, PackagePlus, ShoppingCart, SlidersHorizontal, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { db } from '../../db/db'
import { formatDate } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import { ListSkeleton } from '../../lib/skeleton'
import type { Cart, Product } from '../../db/types'
import type { MovementType } from '../../db/types'

const MAX_ITEMS = 5

const MOVEMENT_LABEL: Record<MovementType, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
}

const MOVEMENT_STYLES: Record<MovementType, { icon: LucideIcon; tile: string; delta: string }> = {
  entrada: { icon: PackagePlus, tile: 'bg-emerald-50 text-emerald-700', delta: 'text-emerald-700' },
  salida: { icon: PackageMinus, tile: 'bg-red-50 text-red-600', delta: 'text-red-600' },
  ajuste: { icon: SlidersHorizontal, tile: 'bg-amber-50 text-amber-700', delta: 'text-amber-700' },
}

// ponytail: short date; upgrade to relative "Hoy, 10:24" log format if asked
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

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
function nextCart(carts: Cart[]) {
  return [...carts].sort((a, b) => (a.estimatedDate ?? '9999').localeCompare(b.estimatedDate ?? '9999') || a.createdAt.localeCompare(b.createdAt))[0]
}

/** / — the Inicio dashboard: the stock KPI card, the next-restock and
 * estimated-purchase tiles, and recent movements (design contract, block 1). */
export function InicioScreen() {
  const [backupOpen, setBackupOpen] = useState(false)
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

          {/* Compras card: next restock + estimated purchase; a fuller purchases
              summary card is planned (pen 2026-09-16 "Próximamente") */}
          <section
            aria-label="Próximas compras"
            className="mt-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-3">
              <Link
                to="/compras/carritos"
                className="pressable flex min-w-0 flex-1 items-center gap-2 rounded-xl transition hover:opacity-80"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black leading-none tracking-tight text-slate-900">
                    {upcoming?.estimatedDate ? formatDate(upcoming.estimatedDate) : '—'}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">Próxima reposición</p>
                </div>
              </Link>
              <div aria-hidden="true" className="h-8 w-px flex-shrink-0 bg-slate-200" />
              <Link
                to="/compras/carritos"
                className="pressable flex min-w-0 flex-1 items-center gap-2 rounded-xl transition hover:opacity-80"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black leading-none tracking-tight text-slate-900">
                    {upcomingTotal != null ? formatMoney(upcomingTotal).replace(' MXN', '') : '—'}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">Compra estimada</p>
                </div>
              </Link>
            </div>
            <div aria-hidden="true" className="mt-3 h-px bg-slate-100" />
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <Timer className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              Próximamente: card de compras
            </p>
          </section>

          {/* Recent movements: one card per movement, styled by type (pen 2026-09-16) */}
          <section aria-label="Historial de movimientos" className="pt-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
              <h2 className="text-sm font-bold text-slate-800">Historial de movimientos</h2>
              {movements.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {movements.map((m) => {
                    const style = MOVEMENT_STYLES[m.type]
                    const Icon = style.icon
                    return (
                      <li
                        key={m.id}
                        className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white p-2.5"
                      >
                        <span
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${style.tile}`}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold text-slate-900">
                            {m.productTitle}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500">
                            {MOVEMENT_LABEL[m.type]} · {shortDate(m.date)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className={`text-[13px] font-extrabold ${style.delta}`}>
                            {m.delta > 0 ? '+' : ''}
                            {m.delta}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400">
                            → {m.resultingQty}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="mt-3 flex items-start gap-3.5 rounded-xl border border-slate-200/70 bg-white p-3">
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
            </div>
          </section>
        </>
      )}

      <button
        type="button"
        onClick={() => setBackupOpen(true)}
        className="pressable mx-auto mt-8 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6H16a5 5 0 0 1 1 9.9M9 19l3 3m0 0 3-3m-3 3V9" />
        </svg>
        Respaldo de datos
      </button>
      {backupOpen && <BackupModal onClose={() => setBackupOpen(false)} />}
    </section>
  )
}
