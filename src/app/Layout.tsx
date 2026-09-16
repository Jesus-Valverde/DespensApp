import { useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Database, DatabaseBackup, EllipsisVertical, LayoutGrid, ShoppingCart, Warehouse } from 'lucide-react'
import { db } from '../db/db'
import { NotificationsPanel } from './NotificationsPanel'
import { BackupModal } from './BackupModal'
import { CatalogDataModal } from '../features/products/CatalogDataModal'
import { CsvHelpModal } from '../features/products/CsvHelpModal'
import { ImportCsvModal } from '../features/products/ImportCsvModal'

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
  const [bellOpen, setBellOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const [catalogDataOpen, setCatalogDataOpen] = useState(false)
  const [csvImportOpen, setCsvImportOpen] = useState(false)
  const [csvHelpOpen, setCsvHelpOpen] = useState(false)

  // Notifications: products under their minimum stock with alerts enabled.
  const notifications = useLiveQuery(
    () =>
      db.products
        .filter(
          (p) =>
            p.stock.alerts === true &&
            p.stock.min != null &&
            p.stock.current <= p.stock.min,
        )
        .toArray(),
    [],
  )
  const notificationCount = notifications?.length ?? 0

  return (
    // Phone frame: centered 430px column with edge borders (Stitch design).
    <div className="flex min-h-dvh justify-center bg-slate-100 selection:bg-blue-100 selection:text-blue-700">
      <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-hidden border-x border-slate-200/60 bg-slate-50 text-slate-900 shadow-2xl">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 pb-2 pt-[max(env(safe-area-inset-top),12px)] shadow-[0_1px_6px_0_rgba(15,23,42,0.06)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogoMark />
              <div className="leading-none">
                <span className="text-xl font-bold tracking-tight text-slate-900">DespensApp</span>
                <span className="mt-0.5 block text-[10px] font-medium text-slate-400">Control de despensa</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBellOpen(true)}
                aria-label={`Notificaciones${notificationCount > 0 ? ` (${notificationCount})` : ''}`}
                className="pressable relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
                )}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label="Más opciones"
                  aria-expanded={menuOpen}
                  className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <EllipsisVertical className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" aria-hidden="true" onClick={() => setMenuOpen(false)} />
                    <div
                      role="menu"
                      aria-label="Opciones de datos"
                      className="absolute right-0 top-11 z-40 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          setBackupOpen(true)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <DatabaseBackup className="h-4 w-4 text-blue-600" strokeWidth={2} aria-hidden="true" />
                        Respaldo de datos
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          setCatalogDataOpen(true)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Database className="h-4 w-4 text-emerald-600" strokeWidth={2} aria-hidden="true" />
                        Datos del catálogo
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {bellOpen && (
          <NotificationsPanel products={notifications ?? []} onClose={() => setBellOpen(false)} />
        )}

        {backupOpen && <BackupModal onClose={() => setBackupOpen(false)} />}
        {catalogDataOpen && (
          <CatalogDataModal
            onClose={() => setCatalogDataOpen(false)}
            onImport={() => {
              setCatalogDataOpen(false)
              setCsvImportOpen(true)
            }}
            onHelp={() => {
              setCatalogDataOpen(false)
              setCsvHelpOpen(true)
            }}
          />
        )}
        {csvImportOpen && <ImportCsvModal onClose={() => setCsvImportOpen(false)} />}
        {csvHelpOpen && <CsvHelpModal onClose={() => setCsvHelpOpen(false)} />}

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
