import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

/** Click/tap-friendly explainer (native title tooltips don't work on touch). */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const tipId = useId()

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span ref={rootRef} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tipId}
        aria-label={`About ${label}`}
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-mono text-muted hover:text-ink hover:border-border-bright transition-colors"
      >
        ?
      </button>
      {open && (
        <span
          id={tipId}
          role="note"
          className="absolute z-30 left-0 top-full mt-2 w-64 sm:w-72 rounded-xl border border-border-bright bg-white p-3 text-xs text-ink/80 leading-relaxed shadow-xl font-normal normal-case tracking-normal"
        >
          {children}
        </span>
      )}
    </span>
  )
}
