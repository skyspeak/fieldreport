import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useData } from '../data/DataContext'
import { MajorSearch } from '../components/MajorSearch'
import { BrandMark } from '../components/BrandMark'
import { DocumentMeta } from '../components/DocumentMeta'
import { useAppPaths } from '../lib/useAppPaths'
import { useTheme } from '../lib/theme'

const EXHIBIT = [
  {
    cip: '46.0302',
    label: 'Electrician',
    tier: 'Low exposure',
    barClass: 'bg-positive',
    dotClass: 'bg-positive',
  },
  {
    cip: '51.3801',
    label: 'Nursing (RN)',
    tier: 'Mid exposure',
    barClass: 'bg-warning',
    dotClass: 'bg-warning',
  },
  {
    cip: '11.0701',
    label: 'Computer Science',
    tier: 'High exposure',
    barClass: 'bg-negative',
    dotClass: 'bg-negative',
  },
] as const

export function HomePage() {
  const { majors, loading, error } = useData()
  const { resultsBase } = useAppPaths()
  const { isDark } = useTheme()

  return (
    <div className="flex flex-col items-center justify-start pt-12 sm:pt-20 pb-16 px-4">
      <DocumentMeta />
      <div className="text-center max-w-2xl mx-auto w-full">
        <BrandMark size="lg" as="h1" variant="field" />
        <p className="text-lg sm:text-xl text-muted mb-8">
          What&apos;s your degree actually worth?
        </p>

        <div className="flex justify-center">
          {loading ? (
            <p className="text-muted">Loading data...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <MajorSearch
              majors={majors}
              size="lg"
              autoFocus
              resultsBase={resultsBase}
              placeholder="Search your major..."
              tone={isDark ? 'dark' : 'light'}
            />
          )}
        </div>

        <p className="text-sm text-muted mt-6">
          BLS salary data, projected annual openings, AI-exposure, and Eloundou β (LLM task
          exposure) — for every U.S. major.
        </p>

        <div className="mt-12 flex items-center justify-center gap-6 sm:gap-12 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-primary font-mono tabular-nums">
              811
            </div>
            <div className="text-xs text-muted mt-1">Occupations</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-accent font-mono tabular-nums">
              1,920
            </div>
            <div className="text-xs text-muted mt-1">Majors</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-positive font-mono tabular-nums">
              50
            </div>
            <div className="text-xs text-muted mt-1">States + DC</div>
          </div>
        </div>

        <ExhibitA />
      </div>
    </div>
  )
}

function ExhibitA() {
  const { occupations, crosswalk } = useData()
  const { resultsBase } = useAppPaths()

  const columns = useMemo(() => {
    if (!occupations.length || !Object.keys(crosswalk).length) return null
    const bySoc = new Map(occupations.map((o) => [o.soc, o]))
    return EXHIBIT.flatMap((item) => {
      const entry = crosswalk[item.cip]
      if (!entry) return []
      const occs = [...new Set([...entry.primary, ...entry.related])].flatMap(
        (soc) => bySoc.get(soc) ?? [],
      )
      if (!occs.length) return []
      const avg =
        occs.reduce((sum, o) => sum + (o.karpathyExposure ?? 0), 0) / occs.length
      return [{ ...item, score: Math.round(avg * 10) / 10 }]
    })
  }, [occupations, crosswalk])

  if (!columns?.length) return null

  return (
    <div className="mt-12 w-full bg-surface border border-border rounded-xl p-5 sm:p-6 text-left">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-1.5">
        Exhibit A
      </div>
      <h2 className="font-serif text-lg sm:text-xl text-ink">
        Same tuition, wildly different AI odds
      </h2>
      <p className="text-xs sm:text-sm text-muted mt-1 mb-6">
        Average AI-exposure score (0–10) across each major&apos;s matched jobs. Tap a column for
        the receipts.
      </p>
      <div className="relative">
        <div className="flex">
          {columns.map((col, i) => (
            <Link
              key={col.cip}
              to={`${resultsBase}/${col.cip}`}
              aria-label={`${col.label}: ${col.score} out of 10 AI exposure (${col.tier.toLowerCase()}) — see the full report`}
              className="group flex-1 flex flex-col items-center min-w-0"
            >
              <div className="h-32 sm:h-44 flex flex-col justify-end items-center">
                <span
                  className="exhibit-fade font-mono tabular-nums text-sm text-ink mb-1.5"
                  style={{ animationDelay: `${0.75 + i * 0.1}s` }}
                >
                  {col.score}
                </span>
                <div
                  className={`exhibit-bar w-6 rounded-t transition-[filter] group-hover:brightness-125 ${col.barClass}`}
                  style={{
                    height: `${col.score * 10}%`,
                    animationDelay: `${0.55 + i * 0.1}s`,
                  }}
                />
              </div>
              <div className="pt-3 text-center px-1">
                <div className="text-[11px] sm:text-sm font-medium leading-tight text-ink/80 group-hover:text-ink group-hover:underline underline-offset-2 transition-colors">
                  {col.label}
                </div>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${col.dotClass}`}
                  />
                  {col.tier}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="absolute inset-x-0 top-32 sm:top-44 h-px bg-border-bright" />
      </div>
    </div>
  )
}
