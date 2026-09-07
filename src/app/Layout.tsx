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
const SettingsIcon = icon(
  'M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75',
)

const tabs: { to: string; label: string; end?: boolean; Icon: IconComponent }[] = [
  { to: '/', label: 'Inicio', end: true, Icon: HomeIcon },
  { to: '/products', label: 'Productos', Icon: ProductsIcon },
  { to: '/carts', label: 'Carritos', Icon: CartsIcon },
  { to: '/lists', label: 'Listas', Icon: ListsIcon },
  { to: '/settings/suppliers', label: 'Ajustes', Icon: SettingsIcon },
]

function fabFor(pathname: string): { to: string; label: string } | null {
  // Exact list routes only — no FAB over detail/edit/new screens.
  if (pathname === '/products') return { to: '/products/new', label: 'Nuevo producto' }
  if (pathname === '/carts') return { to: '/carts/new', label: 'Nuevo carrito' }
  return null
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const fab = fabFor(pathname)

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-md items-center px-4">
          <span className="text-lg font-semibold text-blue-600">DespensApp</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4 pb-28">{children}</main>

      {fab && (
        <Link
          to={fab.to}
          aria-label={fab.label}
          title={fab.label}
          className="fixed bottom-24 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-3xl leading-none text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700"
        >
          +
        </Link>
      )}

      <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {tabs.map(({ to, label, end, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                    isActive ? 'text-blue-600' : 'text-slate-500'
                  }`
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
