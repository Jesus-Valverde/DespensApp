import { Link, Navigate } from 'react-router'

export interface ToggleItem {
  key: string
  label: string
}

/** Segmented view toggle for module screens (Despensa's Stock|Catálogo,
 * Compras' Carritos|Listas|Proveedores). Each segment is a link to
 * `{base}/{key}`; the chosen view is remembered in localStorage. */
export function ModuleToggle({
  base,
  storageKey,
  items,
  active,
}: {
  base: string
  storageKey: string
  items: ToggleItem[]
  active: string
}) {
  return (
    <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
      {items.map((item) => {
        const selected = item.key === active
        return (
          <Link
            key={item.key}
            aria-current={selected ? 'page' : undefined}
            to={`${base}/${item.key}`}
            onClick={() => {
              try {
                localStorage.setItem(storageKey, item.key)
              } catch {
                // Private mode: remembering is best-effort.
              }
            }}
            className={`flex-1 rounded-lg py-1.5 text-center text-sm transition ${
              selected
                ? 'bg-white font-semibold text-blue-700 shadow-sm'
                : 'font-medium text-slate-500 hover:text-slate-700'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

/** /despensa and /compras redirect to the last visited view of the module. */
export function RememberedViewRedirect({ storageKey, fallback }: { storageKey: string; fallback: string }) {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(storageKey)
  } catch {
    // Private mode: fall back to the module default.
  }
  return <Navigate to={saved ?? fallback} replace />
}
