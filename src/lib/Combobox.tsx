import { useEffect, useId, useRef, useState } from 'react'

const fieldClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-500'

/** Styled dropdown-with-free-input (replaces native datalist so desktop and
 * mobile render identically). Typing filters the options; picking one calls
 * both `onChange` and `onPick` (exact option) so forms can react to explicit
 * selections; any other input stays free text. */
export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  onPick,
  ariaLabel,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  onPick?: (value: string) => void
  ariaLabel?: string
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const needle = value.trim().toLowerCase()
  const visible = needle
    ? options.filter((option) => option.toLowerCase().includes(needle))
    : options

  // Close on outside click/tap.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  function choose(option: string) {
    onChange(option)
    onPick?.(option)
    setOpen(false)
    setActive(-1)
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={ariaLabel}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
              return
            }
            if (!open || visible.length === 0) return
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
              setActive((current) => Math.min(current + 1, visible.length - 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((current) => Math.max(current - 1, -1))
            } else if (event.key === 'Enter' && active >= 0) {
              // Enter picks the highlighted option instead of submitting the form.
              event.preventDefault()
              choose(visible[active])
            }
          }}
          className={`${fieldClass} pl-10 pr-10`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      {open && visible.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {visible.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                onClick={() => choose(option)}
                onMouseEnter={() => setActive(index)}
                className={`block w-full px-3.5 py-2 text-left text-sm transition-colors ${
                  index === active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
