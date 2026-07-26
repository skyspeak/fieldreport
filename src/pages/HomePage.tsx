import { useData } from '../data/DataContext'
import { MajorSearch } from '../components/MajorSearch'
import { BrandMark } from '../components/BrandMark'
import { DocumentMeta } from '../components/DocumentMeta'
import { InfoTip } from '../components/InfoTip'
import { formatNumber } from '../lib/format'

export function HomePage({ routePrefix = '' }: { routePrefix?: '' | '/v2' }) {
  const { majors, occupations, eloundouMeta, loading, error } = useData()
  const resultsBase = `${routePrefix}/results`

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-24 pb-16 sm:pb-20">
      <DocumentMeta description="BLS salary data, projected annual openings, AI Risk, and Eloundou β (LLM exposure) — for every U.S. major." />
      <div className="text-center max-w-3xl mx-auto">
        <BrandMark size="lg" as="h1" />
        <p className="mt-5 sm:mt-6 text-lg sm:text-2xl text-ink/70 font-light leading-snug px-1">
          What&apos;s your degree actually worth?
        </p>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
          BLS salary data, projected annual openings, AI Risk, and Eloundou β (LLM exposure) —
          for every U.S. major.
        </p>
      </div>

      <div className="mt-8 sm:mt-12 flex justify-center px-0">
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
            placeholder="Search a major…"
          />
        )}
      </div>

      <div className="mt-12 sm:mt-20 grid grid-cols-3 gap-3 sm:gap-10 max-w-lg mx-auto text-center">
        <Stat value={formatNumber(occupations.length || 811)} label="Occupations" />
        <Stat value={formatNumber(majors.length || 1920)} label="Majors" />
        <Stat
          value={`${eloundouMeta?.coverage.pct ?? '—'}%`}
          label="With Eloundou data"
          tip="Share of occupations in this app that match an Eloundou et al. LLM-exposure score — not a risk level for any one major."
        />
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
  tip,
}: {
  value: string
  label: string
  tip?: string
}) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-xl sm:text-3xl text-ink tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-[10px] sm:text-sm text-muted mt-1 uppercase tracking-wider leading-tight inline-flex items-center justify-center gap-0.5">
        {label}
        {tip ? <InfoTip label={label}>{tip}</InfoTip> : null}
      </div>
    </div>
  )
}
