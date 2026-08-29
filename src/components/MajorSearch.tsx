import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Major } from '../types'
import { searchMajors } from '../lib/majorSearch'
import { useTheme } from '../lib/theme'

interface MajorSearchProps {
  majors: Major[]
  size?: 'lg' | 'md'
  autoFocus?: boolean
  /** Base path for results, e.g. `/results` or `/v2/results` */
  resultsBase?: string
  placeholder?: string
  tone?: 'light' | 'dark'
}

export function MajorSearch({
  majors,
  size = 'lg',
  autoFocus = false,
  resultsBase = '/results',
  placeholder = 'Search your major...',
  tone,
}: MajorSearchProps) {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const resolvedTone = tone ?? (isDark ? 'dark' : 'light')
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const activeRef = useRef(0)

  const results = useMemo(() => searchMajors(majors, query, 10), [majors, query])

  const showList = open
  const hasResults = results.length > 0
  const emptyQuery = query.trim().length === 0
  const showEmpty = showList && !hasResults && !emptyQuery

  useEffect(() => {
    if (!autoFocus) return
    // Don't steal focus / open the keyboard on phones
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (coarse) return
    inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    setActive(0)
    activeRef.current = 0
  }, [query])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  function select(major: Major) {
    navigate(`${resultsBase}/${major.cip}`)
    setQuery(major.name)
    setOpen(false)
  }

  function submitActive() {
    const pick = results[activeRef.current] ?? results[0]
    if (pick) select(pick)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (results.length > 0) submitActive()
    else setOpen(true)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (!hasResults) return
      setActive((i) => {
        const next = Math.min(i + 1, results.length - 1)
        activeRef.current = next
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!hasResults) return
      setActive((i) => {
        const next = Math.max(i - 1, 0)
        activeRef.current = next
        return next
      })
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const pad =
    size === 'lg'
      ? 'py-3.5 sm:py-4 text-base sm:text-lg pl-11 sm:pl-12 pr-4 min-h-12'
      : 'py-3 sm:py-2.5 text-base sm:text-sm pl-10 pr-3 min-h-11 sm:min-h-0'
  const iconLeft = size === 'lg' ? 'left-3.5 sm:left-4' : 'left-3'
  const activeOptionId = hasResults ? `${listId}-opt-${active}` : undefined

  return (
    <div
      ref={rootRef}
      className={`relative w-full ${size === 'lg' ? 'max-w-2xl' : ''}`}
    >
      <form onSubmit={onSubmit} className="relative">
        <svg
          className={`absolute ${iconLeft} top-1/2 -translate-y-1/2 text-muted pointer-events-none`}
          width={size === 'lg' ? 20 : 16}
          height={size === 'lg' ? 20 : 16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`w-full border text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${pad} ${
            resolvedTone === 'dark'
              ? 'rounded-xl bg-surface border-border-bright shadow-none text-ink'
              : 'rounded-full bg-card border-border-bright shadow-sm'
          }`}
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={activeOptionId}
          enterKeyHint="search"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
        />
      </form>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute z-40 mt-2 w-full max-h-[min(20rem,min(50vh,40dvh))] overflow-auto rounded-xl border border-border-bright ${
            resolvedTone === 'dark' ? 'bg-surface shadow-2xl' : 'bg-card shadow-xl'
          }`}
        >
          {hasResults ? (
            results.map((major, i) => (
              <li
                key={major.cip}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
              >
                <button
                  type="button"
                  onMouseEnter={() => {
                    setActive(i)
                    activeRef.current = i
                  }}
                  onClick={() => select(major)}
                  className={`w-full text-left px-4 py-3.5 sm:py-3 min-h-12 sm:min-h-0 transition-colors ${
                    i === active
                      ? 'bg-primary/20 text-ink'
                      : 'text-ink/80 hover:bg-surface-hover'
                  }`}
                >
                  <div className="font-medium text-sm sm:text-base leading-snug">
                    {major.name}
                  </div>
                  <div className="text-xs text-muted mt-0.5 font-mono">
                    {major.category} · CIP {major.cip}
                  </div>
                </button>
              </li>
            ))
          ) : showEmpty ? (
            <li className="px-4 py-4 text-sm text-muted" role="presentation">
              No majors match “{query.trim()}”. Try a broader term — e.g. Biology,
              Nursing, or Economics.
            </li>
          ) : null}
        </ul>
      )}
    </div>
  )
}
