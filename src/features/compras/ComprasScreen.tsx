import { CartsScreen } from '../carts/CartsScreen'
import { ListsScreen } from '../lists/ListsScreen'
import { SuppliersScreen } from '../suppliers/SuppliersScreen'
import { ModuleToggle } from '../../lib/viewToggle'

/** /compras — the shopping module: Carritos, Listas and Proveedores as views
 * of a single tab (there are no Carritos/Listas/Proveedores tabs). The chosen
 * view is remembered (see routes in App). */
export function ComprasScreen({ view }: { view: 'carritos' | 'listas' | 'proveedores' }) {
  return (
    <section>
      <h1 className="text-2xl font-black tracking-tight text-slate-900">Compras</h1>

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
