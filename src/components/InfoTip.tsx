import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** Click/tap-friendly explainer (native title tooltips don't work on touch). */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState<{ right: boolean; above: boolean }>({
    right: false,
    above: false,
  })
  const rootRef = useRef<HTMLSpanElement>(null)
  const tipId = useId()

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()
    const tipW = Math.min(288, window.innerWidth - 16)
    const tipH = 140
    setPlace({
      right: rect.left > window.innerWidth - tipW - 8,
      above: window.innerHeight - rect.bottom < tipH && rect.top > tipH,
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDoc(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span ref={rootRef} className="relative inline-flex align-middle shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tipId}
        aria-label={`About ${label}`}
        onClick={() => setOpen((v) => !v)}
        className="-my-2 -mr-1 ml-0 inline-flex h-11 w-11 items-center justify-center rounded-full text-[11px] font-mono text-muted hover:text-ink transition-colors"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border hover:border-border-bright">
          ?
        </span>
      </button>
      {open && (
        <span
          id={tipId}
          role="note"
          className={[
            'absolute z-40 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border-bright bg-white p-3 text-xs text-ink/80 leading-relaxed shadow-xl font-normal normal-case tracking-normal',
            place.above ? 'bottom-full mb-2 top-auto' : 'top-full mt-2',
            place.right ? 'right-0 left-auto' : 'left-0',
          ].join(' ')}
        >
          {children}
        </span>
      )}
    </span>
  )
}
