import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'
import { useAppPaths } from '../lib/useAppPaths'

export function Layout({ children }: { children: ReactNode }) {
  const { home } = useAppPaths()
  const letterUrl = (import.meta.env.VITE_LETTER_URL as string | undefined)?.replace(
    /\/$/,
    '',
  )

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-page text-ink antialiased">
      <header className="border-b border-border sticky top-0 z-30 bg-page/90 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-14 py-2 flex items-center gap-2">
          <Link to={home} className="no-underline shrink-0 inline-flex items-center min-h-11">
            <BrandMark size="sm" variant="field" />
          </Link>
          <span className="hidden lg:block text-xs text-muted ml-auto mr-3">
            Salaries, openings, AI-exposure, Eloundou β — and who hires where.
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
                </a>
                ,{' '}
                <a
                  href="https://www.bls.gov/emp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-ink underline"
                >
                  BLS Projections
                </a>
                ,{' '}
                <a
                  href="https://www.onetcenter.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-ink underline"
                >
                  O*NET
                </a>
                ,{' '}
                <a
                  href="https://github.com/openai/GPTs-are-GPTs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-ink underline"
                >
                  GPTs-are-GPTs
                </a>
                , and AOI / WYWM employer ratings
                {letterUrl ? (
                  <>
                    {' · '}
                    <a className="text-muted hover:text-ink underline" href={letterUrl}>
                      The Letter
                    </a>
                  </>
                ) : null}
              </div>
              <div className="text-muted">© {new Date().getFullYear()} Field Report</div>
            </div>
            <div className="text-center sm:text-left text-muted/80">
              Salaries &amp; openings: BLS OEWS May 2024. Growth: 10-year BLS projections
              (2024-2034). Competition: IPEDS 2023 completions ÷ annual openings. AI risk: Frey
              &amp; Osborne (2013) + Karpathy/BLS OOH (2025). Eloundou β: Eloundou et al. (2023)
              / OpenAI GPTs-are-GPTs. Employer layer: American Opportunity Index / WYWM.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
