import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BrandMark } from './BrandMark'
import { MajorSearch } from './MajorSearch'
import { useData } from '../data/DataContext'
import { useAppPaths } from '../lib/useAppPaths'

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { home, resultsBase } = useAppPaths()
  const { majors, loading } = useData()
  const isHome =
    pathname === '/' || pathname === '/v2' || pathname === '/v3'
  const isV3 = pathname.startsWith('/v3')
  const showGlobalSearch = !isHome && !loading && majors.length > 0
  const letterUrl = (import.meta.env.VITE_LETTER_URL as string | undefined)?.replace(/\/$/, '')

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
        <div
          className={`mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 ${
            showGlobalSearch
              ? 'flex flex-row items-center gap-3 sm:gap-6'
              : 'flex items-center gap-3 sm:gap-6'
          }`}
        >
          <Link
            to={home}
            className="no-underline shrink-0 inline-flex items-center min-h-11"
          >
            <BrandMark size="sm" compact={showGlobalSearch} />
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
              {isV3
                ? 'Rated early-career employers by major and metro.'
                : 'Salaries, openings, AI Risk & Eloundou β for every U.S. major.'}
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 min-w-0">{children}</main>

      <footer className="border-t border-border mt-auto bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between text-sm">
          <div className="min-w-0">
            <p className="font-serif text-ink/70">
              © {new Date().getFullYear()} dear[CC] Field report
            </p>
            <p className="text-muted mt-2 max-w-2xl leading-relaxed text-xs sm:text-sm">
              Salaries & openings: BLS OEWS May 2024. Growth: 10-year BLS projections
              (2024–2034). Competition: IPEDS completions ÷ BLS openings. AI Risk:
              Karpathy/BLS OOH (LLM-scored 2025) + Frey &amp; Osborne (2013 baseline).
              Eloundou β: Eloundou et al. (2023) share of tasks exposed to LLMs; α =
              without tools, γ = with tools; β blends both.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted text-xs">
            {letterUrl && (
              <a className="hover:text-ink underline inline-flex items-center min-h-11 py-2" href={letterUrl}>
                The Letter
              </a>
            )}
            <a
              className="hover:text-ink underline inline-flex items-center min-h-11 py-2"
              href="https://www.bls.gov/oes/"
              target="_blank"
              rel="noopener noreferrer"
            >
              BLS OEWS
            </a>
            <a
              className="hover:text-ink underline inline-flex items-center min-h-11 py-2"
              href="https://www.bls.gov/emp/"
              target="_blank"
              rel="noopener noreferrer"
            >
              BLS Projections
            </a>
            <a
              className="hover:text-ink underline inline-flex items-center min-h-11 py-2"
              href="https://github.com/openai/GPTs-are-GPTs"
              target="_blank"
              rel="noopener noreferrer"
            >
              GPTs-are-GPTs
            </a>
            <a
              className="hover:text-ink underline inline-flex items-center min-h-11 py-2"
              href="https://www.onetcenter.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              O*NET
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
