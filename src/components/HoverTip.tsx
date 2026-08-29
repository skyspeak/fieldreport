import { useEffect, useState, type ReactNode, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'

/** Hover on desktop, tap to toggle on touch. Explanations stay off the table. */
export function HoverTip({
  content,
  children,
  maxWidth = 300,
}: {
  content: ReactNode
  children: ReactNode
  maxWidth?: number
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [pinned, setPinned] = useState(false)

  function place(e: MouseEvent) {
    setPos({ x: e.clientX, y: e.clientY })
  }

  function onClick(e: MouseEvent) {
    e.stopPropagation()
    if (pinned) {
      setPinned(false)
      setPos(null)
      return
    }
    setPinned(true)
    place(e)
  }

  useEffect(() => {
    if (!pinned) return
    function onDoc(ev: Event) {
      const t = ev.target as HTMLElement | null
      if (t?.closest?.('[data-hover-tip]')) return
      setPinned(false)
      setPos(null)
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        setPinned(false)
        setPos(null)
      }
    }
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', onDoc)
      document.addEventListener('touchstart', onDoc, { passive: true })
      document.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [pinned])

  const width = typeof window !== 'undefined' ? Math.min(maxWidth, window.innerWidth - 16) : maxWidth
  const flip = pos ? pos.x > window.innerWidth - width - 32 : false

  return (
    <>
      <div
        data-hover-tip
        className="inline-flex max-w-full"
        onMouseEnter={(e) => {
          if (!pinned) place(e)
        }}
        onMouseMove={(e) => {
          if (!pinned) place(e)
        }}
        onMouseLeave={() => {
          if (!pinned) setPos(null)
        }}
        onClick={onClick}
      >
        {children}
      </div>
      {pos &&
        createPortal(
          <div
            data-hover-tip
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: Math.max(8, flip ? pos.x - width - 12 : pos.x + 14),
              top: Math.min(pos.y - 10, window.innerHeight - 140),
              maxWidth: width,
            }}
          >
            <div className="bg-surface border border-border-bright rounded-xl p-3 shadow-2xl text-sm leading-snug text-ink">
              {content}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
