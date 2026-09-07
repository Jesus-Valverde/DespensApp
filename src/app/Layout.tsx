import { type ComponentType, type ReactNode, type SVGProps } from 'react'
import { Link, NavLink, useLocation } from 'react-router'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

function icon(d: string): IconComponent {
  return function Icon(props) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      </svg>
    )
  }
}

/** Brand mark: 3D box (Stitch design). */
function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

/** Plus glyph for the floating action button. */
function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      {...props}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

const HomeIcon = icon(
  'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
)
const ProductsIcon = icon(
  'm21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
)
const CartsIcon = icon(
  'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z',
)
const ListsIcon = icon(
  'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
)
const SuppliersIcon = icon(
  'M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75',
)

/** Catalog glyph: grid of squares (Productos tab). */
const CatalogIcon = icon('M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z')

const tabs: { to: string; label: string; end?: boolean; Icon: IconComponent }[] = [
  { to: '/', label: 'Inicio', end: true, Icon: HomeIcon },
  { to: '/despensa', label: 'Despensa', Icon: ProductsIcon },
  { to: '/products', label: 'Productos', Icon: CatalogIcon },
  { to: '/carts', label: 'Carritos', Icon: CartsIcon },
  { to: '/lists', label: 'Listas', Icon: ListsIcon },
  { to: '/settings/suppliers', label: 'Proveedores', Icon: SuppliersIcon },
]

function fabFor(pathname: string): { to: string; label: string } | null {
  // Exact list routes only — no FAB over detail/edit/new screens.
  if (pathname === '/despensa' || pathname === '/products')
    return { to: '/products/new', label: 'Nuevo producto' }
  if (pathname === '/carts') return { to: '/carts/new', label: 'Nuevo carrito' }
  return null
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const fab = fabFor(pathname)

  return (
    // Phone frame: centered 430px column with edge borders (Stitch design).
    <div className="flex min-h-dvh justify-center bg-slate-100 selection:bg-blue-100 selection:text-blue-700">
      <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-hidden border-x border-slate-200/60 bg-slate-50 text-slate-900 shadow-2xl">
        <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-slate-50/90 px-5 pb-2 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-sm shadow-blue-500/20">
                <LogoIcon className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold tracking-tight text-blue-600">DespensApp</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 pt-5 pb-28">{children}</main>

        {fab && (
          <Link
            to={fab.to}
            aria-label={fab.label}
            title={fab.label}
            className="pressable fixed bottom-24 right-[max(1.25rem,calc(50vw-195px))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
          >
            <PlusIcon className="h-6 w-6" aria-hidden="true" />
          </Link>
        )}

        <nav
          aria-label="Navegación principal"
          className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-slate-200/80 bg-white/95 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur-md"
        >
          <ul className="grid grid-cols-6 pt-1.5 pb-1">
            {tabs.map(({ to, label, end, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `pressable group flex flex-col items-center justify-center py-1 ${
                      isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex items-center justify-center rounded-full px-2.5 py-1 transition-transform group-active:scale-95 ${
                          isActive ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span
                        className={`mt-0.5 text-[10px] leading-tight ${
                          isActive ? 'font-bold text-blue-600' : 'font-medium'
                        }`}
                      >
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
