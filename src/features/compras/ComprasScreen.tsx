import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { CartsScreen } from '../carts/CartsScreen'
import { ListsScreen } from '../lists/ListsScreen'
import { SuppliersScreen } from '../suppliers/SuppliersScreen'
import { ModuleToggle } from '../../lib/viewToggle'

const VIEW_HEADERS: Record<'carritos' | 'listas' | 'proveedores', { title: string; subtitle: string }> = {
  carritos: { title: 'Carritos', subtitle: 'Gestión de compras y pedidos' },
  listas: { title: 'Listas', subtitle: 'Listas de compra reutilizables' },
  proveedores: { title: 'Proveedores', subtitle: 'Directorio de contactos de compra' },
}

/** /compras — the shopping module: Carritos, Listas and Proveedores as views
 * of a single tab (there are no Carritos/Listas/Proveedores tabs). The chosen
 * view is remembered (see routes in App). The header lives here so each view
 * reads like the Despensa module: one title, one subtitle, one toggle. */
export function ComprasScreen({ view }: { view: 'carritos' | 'listas' | 'proveedores' }) {
  const header = VIEW_HEADERS[view]
  const activeCarts =
    useLiveQuery(() => db.carts.where('status').equals('active').count(), []) ?? 0

  return (
    <section>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight text-slate-900">
            {header.title}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{header.subtitle}</p>
        </div>
        {view === 'carritos' && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
            {activeCarts} Activos
          </span>
        )}
      </div>

      <div className="mt-4">
        <ModuleToggle
          base="/compras"
          storageKey="despensapp:compras-view"
          items={[
            { key: 'carritos', label: 'Carritos' },
            { key: 'listas', label: 'Listas' },
            { key: 'proveedores', label: 'Proveedores' },
          ]}
          active={view}
        />
      </div>

      {view === 'carritos' && <CartsScreen />}
      {view === 'listas' && <ListsScreen />}
      {view === 'proveedores' && <SuppliersScreen />}
    </section>
  )
}
