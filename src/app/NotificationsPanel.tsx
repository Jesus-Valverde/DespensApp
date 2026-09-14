import { Link } from 'react-router'
import type { Product } from '../db/types'

/** Notifications panel (guide block 16): products under their minimum stock
 * with alerts enabled, opened from the header bell. */
export function NotificationsPanel({ products, onClose }: { products: Product[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Notificaciones">
      <div className="max-h-[92%] w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-start gap-3 p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">Notificaciones</h2>
            <p className="text-xs text-slate-500">Productos bajo su stock mínimo</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="pressable flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto px-5 pb-2">
          {products.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-semibold text-slate-800">Sin notificaciones.</p>
              <p className="mt-1 text-xs text-slate-500">
                Todos tus productos están por encima de su stock mínimo.
              </p>
            </div>
          ) : (
            products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                onClick={onClose}
                className="pressable flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-blue-200"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">{product.title}</p>
                    <span className="flex-shrink-0 rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Bajo mínimo
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Mín: {product.stock.min} · Actual: {product.stock.current}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="pressable w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
