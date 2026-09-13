import { type ComponentType, type ReactNode, type SVGProps } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { LayoutGrid, ShoppingCart, Warehouse } from 'lucide-react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

/** Brand mark: white logo silhouette on a gradient chip. */
function LogoMark() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-sm shadow-blue-500/20">
      <img src="/logo-white.png" alt="" aria-hidden="true" className="h-5 w-auto" />
    </div>
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

// Tab icons: Lucide, stroke 1.5 to match the inline SVGs used elsewhere.
const tabs: { to: string; label: string; end?: boolean; Icon: IconComponent }[] = [
  { to: '/', label: 'Inicio', end: true, Icon: LayoutGrid },
  { to: '/despensa', label: 'Despensa', Icon: Warehouse },
  { to: '/compras', label: 'Compras', Icon: ShoppingCart },
]

function fabFor(pathname: string): { to: string; label: string } | null {
  // Catalog view of Despensa only — no FAB over the stock view, detail/edit/new
  // screens. The Compras Carritos view renders its own FAB that opens the
  // in-screen create modal.
  if (pathname === '/despensa/catalogo') return { to: '/products/new', label: 'Nuevo producto' }
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
              <LogoMark />
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
          <ul className="grid grid-cols-3 pt-1.5 pb-1">
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
                        <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
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
