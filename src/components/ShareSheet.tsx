import { useEffect, useId, useRef, useState } from 'react'

interface ShareSheetProps {
  title: string
  /** Optional longer blurb included in share bodies */
  summary?: string
  quiet?: boolean
}

export function ShareSheet({ title, summary, quiet = false }: ShareSheetProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const copyTimerRef = useRef<number | null>(null)

  const url = typeof window !== 'undefined' ? window.location.href : ''
  const text = summary
    ? `${title} — ${summary}\n\n${url}`
    : `${title}\n\n${url}`
  const subject = `dear[CC] Field report: ${title}`

  useEffect(() => {
    return () => {
      if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current)
    }
  }, [])

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
    const narrow = window.matchMedia('(max-width: 639px)').matches
    const prev = document.body.style.overflow
    if (narrow) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      if (narrow) document.body.style.overflow = prev
    }
  }, [open])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // ignore
    }
  }

  const channels = [
    {
      id: 'email',
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
    },
    {
      id: 'text',
      label: 'Text',
      href: `sms:?&body=${encodeURIComponent(text)}`,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
      external: true,
    },
  ] as const

  return (
    <div ref={rootRef} className="relative inline-flex w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        className={
          quiet
            ? 'inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-border bg-transparent px-3 py-2 text-sm text-muted hover:text-ink hover:border-border-bright transition-colors min-h-11'
            : 'inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-ink hover:border-border-bright hover:bg-surface transition-colors min-h-11'
        }
      >
        <ShareIcon />
        Share
      </button>

      {open && (
        <>
          {/* Mobile: bottom sheet */}
          <div
            className="fixed inset-0 z-50 bg-black/50 sm:hidden"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            id={menuId}
            role="menu"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-border-bright bg-surface p-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:bottom-auto sm:mt-2 sm:w-56 sm:rounded-xl sm:pb-2 sm:shadow-xl"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-bright sm:hidden" />
            <p className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-wider text-muted font-mono">
              Share this report
            </p>
            {channels.map((c) => (
              <a
                key={c.id}
                role="menuitem"
                href={c.href}
                {...('external' in c && c.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3.5 sm:py-2.5 text-sm text-ink hover:bg-surface transition-colors min-h-11"
              >
                <ChannelIcon id={c.id} />
                {c.label}
              </a>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => void copyLink()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3.5 sm:py-2.5 text-sm text-ink hover:bg-surface transition-colors min-h-11"
            >
              <CopyIcon />
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  )
}

function ChannelIcon({ id }: { id: string }) {
  if (id === 'email') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 7 9-7" />
      </svg>
    )
  }
  if (id === 'text') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden>
        <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.77 14.14c-.24.68-1.4 1.25-1.93 1.33-.49.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.61-2.89-1.25-4.77-4.16-4.92-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.24.58.82 2 .89 2.15.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.12.56.17.28.75 1.23 1.61 2 .99.88 1.81 1.16 2.07 1.29.26.12.41.1.56-.06.15-.17.65-.76.83-1.02.17-.26.35-.22.59-.13.24.1 1.52.72 1.78.85.26.14.44.2.5.31.07.11.07.64-.17 1.32z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}
