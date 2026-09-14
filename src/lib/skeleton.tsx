/** Loading placeholder for live-query screens: renders while Dexie resolves,
 * so the UI never flashes an empty state before data arrives. */
export function ListSkeleton({ rows = 3, className = '' }: { rows?: number; className?: string }) {
  return (
    <ul className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3">
          <span className="h-12 w-12 flex-shrink-0 animate-pulse rounded-xl bg-slate-100" />
          <span className="flex-1 space-y-2">
            <span className="block h-3.5 w-1/3 animate-pulse rounded bg-slate-100" />
            <span className="block h-3 w-1/4 animate-pulse rounded bg-slate-100" />
          </span>
        </li>
      ))}
    </ul>
  )
}
