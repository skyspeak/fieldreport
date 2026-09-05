import type { ReactNode } from 'react'
import { useTheme } from '../lib/theme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex shrink-0 rounded-lg border border-ink/80 p-0.5"
    >
      <ThemeOption
        label="Light"
        active={theme === 'light'}
        onClick={() => setTheme('light')}
      >
        <SunIcon />
      </ThemeOption>
      <ThemeOption
        label="Dark"
        active={theme === 'dark'}
        onClick={() => setTheme('dark')}
      >
        <MoonIcon />
      </ThemeOption>
    </div>
  )
}

function ThemeOption({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label} mode`}
      title={`${label} mode`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[6px] px-2.5 sm:px-3 min-h-9 min-w-11 text-xs font-medium transition-colors ${
        active ? 'bg-ink text-page' : 'text-ink hover:bg-surface-hover'
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 1111.5 3 7 7 0 0021 14.5z" />
    </svg>
  )
}
