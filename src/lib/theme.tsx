import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAppPaths } from './useAppPaths'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'fieldreport-theme'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  /** Dark editorial shell is active (Field Report routes + dark preference). */
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isReport } = useAppPaths()
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const isDark = isReport && theme === 'dark'

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('field-report', isReport)
    document.documentElement.classList.toggle('report-shell', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [isReport, isDark])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark }),
    [theme, setTheme, toggleTheme, isDark],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
