import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BrandMark } from './BrandMark'
import { MajorSearch } from './MajorSearch'
import { ThemeToggle } from './ThemeToggle'
import { useData } from '../data/DataContext'
import { useAppPaths } from '../lib/useAppPaths'

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { home, resultsBase, isV3 } = useAppPaths()
  const { majors, loading } = useData()
  const isHome = pathname === '/' || pathname === '/v2' || pathname === '/v3'
  const showGlobalSearch = isV3 && !isHome && !loading && majors.length > 0
  const letterUrl = (import.meta.env.VITE_LETTER_URL as string | undefined)?.replace(/\/$/, '')

  if (isV3) {
    return (
      <div className="min-h-screen flex flex-col overflow-x-clip">
        <header className="border-b sticky top-0 z-30 pt-[env(safe-area-inset-top)] border-border bg-page/80 backdrop-blur-sm">
          <div
            className={`mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 ${
              showGlobalSearch
                ? 'flex flex-row items-center gap-2 sm:gap-4'
                : 'flex items-center gap-3 sm:gap-6'
            }`}
          >
            <Link to={home} className="no-underline shrink-0 inline-flex items-center min-h-11">
              <BrandMark size="sm" variant="dearcc" compact={showGlobalSearch} />
            </Link>
            {showGlobalSearch ? (
              <div className="w-full min-w-0 flex-1 sm:max-w-xl sm:ml-auto">
                <MajorSearch
                  majors={majors}
                  size="md"
                  resultsBase={resultsBase}
                  placeholder="Search a major…"
                />
              </div>
            ) : (
              <p className="hidden sm:block text-xs text-muted max-w-xs text-right leading-snug ml-auto">
                Rated early-career employers by major and metro.
              </p>
            )}
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
        <footer className="border-t mt-auto pb-[env(safe-area-inset-bottom)] border-border bg-page">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between text-sm">
            <div className="min-w-0">
              <p className="font-serif text-ink/70">
                © {new Date().getFullYear()} dear[CC] Field report
              </p>
              <p className="text-muted mt-2 max-w-2xl leading-relaxed text-xs sm:text-sm">
                Employer ratings and pathways: American Opportunity Index / WYWM.
              </p>
            </div>
            {letterUrl && (
              <a className="hover:text-ink underline text-xs" href={letterUrl}>
                The Letter
              </a>
            )}
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-page text-ink antialiased">
      <header className="border-b border-border sticky top-0 z-30 bg-page/90 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-14 py-2 flex items-center gap-2">
          <Link to={home} className="no-underline shrink-0 inline-flex items-center min-h-11">
            <BrandMark size="sm" variant="field" />
          </Link>
          <span className="hidden lg:block text-xs text-muted ml-auto mr-3">
            Salaries, openings, AI-exposure &amp; Eloundou β for every U.S. major.
          </span>
          <div className="ml-auto lg:ml-0 shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 min-w-0">{children}</main>

      <footer className="border-t border-border mt-auto pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-3 text-xs text-muted">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
              <div>
                Data sourced from{' '}
                <a
                  href="https://www.bls.gov/oes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-ink underline"
                >
                  BLS OEWS
                </a>{' '}
                (May 2024),{' '}
                <a
                  href="https://www.bls.gov/emp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-ink underline"
                >
                  BLS Projections
                </a>{' '}
                (2024-2034), and{' '}
                <a
                  href="https://www.onetcenter.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-ink underline"
                >
                  O*NET
                </a>
                , and{' '}
                <a
                  href="https://github.com/openai/GPTs-are-GPTs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-ink underline"
                >
                  GPTs-are-GPTs
                </a>
              </div>
              <div className="text-muted">© {new Date().getFullYear()} Field Report</div>
            </div>
            <div className="text-center sm:text-left text-muted/80">
              Salaries &amp; openings: BLS OEWS May 2024. Growth: 10-year BLS projections
              (2024-2034). Competition: IPEDS 2023 completions ÷ annual openings. AI risk: Frey
              &amp; Osborne (2013) + Karpathy/BLS OOH (2025). Eloundou β: Eloundou et al. (2023)
              / OpenAI GPTs-are-GPTs — α = E1, β = E1 + 0.5·E2, γ = E1 + E2.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
