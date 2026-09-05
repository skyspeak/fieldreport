import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useData } from '../data/DataContext'
import { MajorSearch } from '../components/MajorSearch'
import { DocumentMeta } from '../components/DocumentMeta'
import { Mascot } from '../components/Mascot'
import { useAppPaths } from '../lib/useAppPaths'
import { useTheme } from '../lib/theme'
import { SEVERITY_COLORS } from '../lib/labels'

const EXHIBIT = [
  {
    cip: '46.0302',
    label: 'Electrician',
    tier: 'Low exposure',
    color: SEVERITY_COLORS.Low,
  },
  {
    cip: '51.3801',
    label: 'Nursing (RN)',
    tier: 'Mid exposure',
    color: SEVERITY_COLORS.Moderate,
  },
  {
    cip: '11.0701',
    label: 'Computer Science',
    tier: 'High exposure',
    color: SEVERITY_COLORS['Very High'],
  },
] as const

export function HomePage() {
  const { majors, loading, error } = useData()
  const { resultsBase } = useAppPaths()
  const { isDark } = useTheme()

  return (
    <div className="flex flex-col items-center justify-start pt-16 sm:pt-24 pb-20 px-4">
      <DocumentMeta />
      <div className="text-center max-w-2xl mx-auto w-full">
        <Mascot className="mx-auto mb-6 h-12 w-12 sm:h-14 sm:w-14" />
        <h1 className="font-sans text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-ink text-balance leading-[1.1]">
          What&apos;s your degree worth?
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted leading-relaxed text-pretty max-w-xl mx-auto">
          Explore both traditional and adjacent jobs for your major. Compare salary data, hiring
          volume, and which paths are growing.
        </p>

        <div className="flex justify-center mt-8">
          {loading ? (
            <p className="text-muted">Loading data...</p>
          ) : error ? (
            <p className="text-negative">{error}</p>
          ) : (
            <MajorSearch
              majors={majors}
              size="lg"
              resultsBase={resultsBase}
              placeholder="Search your major"
              tone={isDark ? 'dark' : 'light'}
            />
          )}
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 sm:gap-12 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-ink font-mono tabular-nums">
              811
            </div>
            <div className="text-xs text-muted mt-1">Occupations</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-ink font-mono tabular-nums">
              1,920
            </div>
            <div className="text-xs text-muted mt-1">Majors</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-ink font-mono tabular-nums">
              50
            </div>
            <div className="text-xs text-muted mt-1">States + DC</div>
          </div>
        </div>

        <blockquote className="mt-12 max-w-lg mx-auto">
          <p className="text-base sm:text-lg text-ink leading-relaxed text-pretty">
            “I had no idea my sociology degree maps to over thirty occupations.”
          </p>
          <footer className="mt-4">
            <cite className="not-italic">
              <span className="block text-sm font-medium text-ink">Samantha Wen</span>
              <span className="block text-sm text-muted">
                Berkeley ’23 and New Work Foundation co-founder
              </span>
            </cite>
          </footer>
        </blockquote>

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
    <div className="mt-14 w-full border border-border rounded-xl p-5 sm:p-6 text-left">
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted mb-1.5">
        Exhibit A
      </div>
      <h2 className="font-sans text-lg sm:text-xl font-semibold text-ink tracking-tight">
        Same tuition, wildly different AI odds
      </h2>
      <p className="text-xs sm:text-sm text-muted mt-1 mb-6">
        Average AI-exposure score (0–10) across each major&apos;s matched jobs.
      </p>
      <div className="relative">
        <div className="flex">
          {columns.map((col, i) => (
            <Link
              key={col.cip}
              to={`${resultsBase}/${col.cip}`}
              aria-label={`${col.label}: ${col.score} out of 10 AI exposure (${col.tier.toLowerCase()}). See the full report`}
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
                  className="exhibit-bar w-6 rounded-t"
                  style={{
                    height: `${col.score * 10}%`,
                    animationDelay: `${0.55 + i * 0.1}s`,
                    backgroundColor: col.color,
                  }}
                />
              </div>
              <div className="pt-3 text-center px-1">
                <div className="text-[11px] sm:text-sm font-medium leading-tight text-ink group-hover:underline underline-offset-2">
                  {col.label}
                </div>
                <div className="mt-1 text-[11px] text-muted">{col.tier}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="absolute inset-x-0 top-32 sm:top-44 h-px bg-border" />
      </div>
    </div>
  )
}
