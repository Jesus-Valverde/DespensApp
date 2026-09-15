import { useNavigate } from 'react-router'

/** Circular back-arrow for window title bars (design contract: the back control
 * lives in the per-screen title row, never in the brand header). */
export function BackButton({ label = 'Regresar' }: { label?: string }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => navigate(-1)}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0 6 6m-6-6 6-6" />
      </svg>
    </button>
  )
}
