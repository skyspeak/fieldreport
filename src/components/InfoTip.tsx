import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type Coords = { top: number; left: number; width: number; ready: boolean }

/** Click/tap-friendly explainer (native title tooltips don't work on touch). */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<Coords>({
    top: 0,
    left: 0,
    width: 288,
    ready: false,
  })
  const rootRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const tipId = useId()

  useLayoutEffect(() => {
    if (!open) return

    function place() {
      const btn = rootRef.current
      const tip = tipRef.current
      if (!btn || !tip) return
      const rect = btn.getBoundingClientRect()
      const tipWidth = Math.min(288, window.innerWidth - 16)
      const tipHeight = tip.offsetHeight
      const pad = 8

      let left = rect.left
      if (left + tipWidth > window.innerWidth - pad) {
        left = window.innerWidth - tipWidth - pad
      }
      if (left < pad) left = pad

      let top = rect.bottom + 8
      if (top + tipHeight > window.innerHeight - pad && rect.top > tipHeight + pad) {
        top = rect.top - tipHeight - 8
      }

      setCoords({ top, left, width: tipWidth, ready: true })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, children])

  useEffect(() => {
    if (!open) setCoords((c) => ({ ...c, ready: false }))
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (rootRef.current?.contains(t) || tipRef.current?.contains(t)) return
      setOpen(false)
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
    <span ref={rootRef} className="relative inline-flex align-middle shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tipId}
        aria-label={`About ${label}`}
        onClick={() => setOpen((v) => !v)}
        className="-my-2 -mx-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-[11px] font-mono text-muted hover:text-ink transition-colors"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border hover:border-border-bright">
          ?
        </span>
      </button>
      {open &&
        createPortal(
          <span
            ref={tipRef}
            id={tipId}
            role="note"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              visibility: coords.ready ? 'visible' : 'hidden',
            }}
            className="z-[60] rounded-xl border border-border-bright bg-white p-3 text-xs text-ink/80 leading-relaxed shadow-xl font-normal normal-case tracking-normal"
          >
            {children}
          </span>,
          document.body,
        )}
    </span>
  )
}
