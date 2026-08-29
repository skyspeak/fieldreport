import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../data/DataContext'
import { DocumentMeta } from '../components/DocumentMeta'
import { HoverTip } from '../components/HoverTip'
import { MajorSearch } from '../components/MajorSearch'
import {
  formatCompactCount,
  formatGrowth,
  formatNumber,
  formatRatio,
  formatSalary,
  formatSalaryK,
  formatShare,
  sentenceCase,
} from '../lib/format'
import {
  AI_BAND_LIVE_COLORS,
  AI_BAND_LIVE_COPY,
  AI_FLAG_LABEL,
  AOI_ATTRIBUTION,
  COMPETITION_COPY,
  COMPETITION_DOT,
  ELOUNDOU_ALPHA_COPY,
  ELOUNDOU_BAND_COLORS,
  ELOUNDOU_COPY,
  ELOUNDOU_GAMMA_COPY,
  ELOUNDOU_METHOD_COPY,
  ENTRY_BARRIER_COPY,
  aiBandLive,
} from '../lib/labels'
import { isRealMajor, majorDisplayName } from '../lib/majorName'
import { useAppPaths } from '../lib/useAppPaths'
import { useTheme } from '../lib/theme'
import { loadPlaces } from '../lib/v3/data'
import type { PlaceRow } from '../lib/v3/types'
import type { AiImpactScore, EloundouScore, Occupation, SortDirection, SortField } from '../types'

type TableSort = Extract<
  SortField,
  | 'title'
  | 'entrySalary'
  | 'openPositions'
  | 'graduatesPerOpening'
  | 'karpathyExposure'
  | 'eloundouBeta'
  | 'entryBarrier'
>

const SORT_CHIPS: { field: Exclude<TableSort, 'title'>; label: string }[] = [
  { field: 'entrySalary', label: 'Entry salary' },
  { field: 'openPositions', label: 'Openings' },
  { field: 'graduatesPerOpening', label: 'Competition' },
  { field: 'karpathyExposure', label: 'AI Risk' },
  { field: 'eloundouBeta', label: 'Eloundou β' },
  { field: 'entryBarrier', label: 'Entry barrier' },
]

const COLUMNS: {
  field: TableSort
  label: string
  className?: string
  why?: string
}[] = [
  { field: 'title', label: 'Occupation' },
  {
    field: 'entrySalary',
    label: 'Entry salary',
    className: 'text-right',
    why: '25th percentile wage from BLS May 2024 OEWS. Median wage is shown underneath.',
  },
  {
    field: 'openPositions',
    label: 'Openings',
    className: 'text-right',
    why: 'Annual job openings from BLS — includes both new positions and replacements for workers who retire or change careers.',
  },
  {
    field: 'graduatesPerOpening',
    label: 'Competition',
    className: 'text-left',
    why: 'Annual degree graduates entering this field divided by annual openings. Lower = easier job market.',
  },
  {
    field: 'karpathyExposure',
    label: 'AI Risk',
    className: 'text-left',
    why: 'Karpathy Digital AI Exposure score (0–10), LLM-scored in 2025. Hover individual rows for the full rationale.',
  },
  {
    field: 'eloundouBeta',
    label: 'Eloundou β',
    className: 'text-left',
    why: 'Headline LLM exposure from Eloundou et al. (2023) / OpenAI GPTs-are-GPTs. β = E1 + 0.5·E2: share of tasks GPT-4 would cut by ≥50% time, with half-credit for tool-augmented tasks.',
  },
  {
    field: 'entryBarrier',
    label: 'Entry barrier',
    className: 'text-left',
    why: ENTRY_BARRIER_COPY,
  },
]

function letterBase(): string {
  return (import.meta.env.VITE_LETTER_URL as string | undefined)?.replace(/\/$/, '') ?? ''
}

function gameplanHref(cip: string, soc?: string): string {
  const base = letterBase()
  if (!base) return ''
  const url = `${base}/plan`
  return soc ? `${url}?soc=${encodeURIComponent(soc)}&cip=${encodeURIComponent(cip)}` : url
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full max-w-[4.5rem] bg-inset rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }}
      />
    </div>
  )
}

function competitionFill(ratio: number | null): number {
  if (ratio == null) return 0
  return Math.min(100, (ratio / 6) * 100)
}

export function ResultsPage() {
  const { cipCode = '' } = useParams()
  const { majors, occupations, crosswalk, eloundouBySoc, aiImpactBySoc, loading } = useData()
  const { home, mapBase, resultsBase } = useAppPaths()
  const { isDark } = useTheme()

  const [showAll, setShowAll] = useState(false)
  const [sortField, setSortField] = useState<TableSort>('entrySalary')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [places, setPlaces] = useState<PlaceRow[]>([])

  useEffect(() => {
    setShowAll(false)
    setSortField('entrySalary')
    setSortDirection('desc')
  }, [cipCode])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const list = await loadPlaces()
      if (!cancelled) setPlaces(list.filter((p) => p.seed))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const major = useMemo(() => {
    if (!isRealMajor(cipCode)) return undefined
    return majors.find((m) => m.cip === cipCode)
  }, [majors, cipCode])

  const { relevant, other } = useMemo(() => {
    const entry = crosswalk[cipCode]
    if (!occupations.length || !entry) {
      return { relevant: [] as Occupation[], other: occupations }
    }
    const linked = new Set([...entry.primary, ...entry.related])
    const primary = new Set(entry.primary)
    const rel: Occupation[] = []
    const rest: Occupation[] = []
    for (const occ of occupations) {
      if (linked.has(occ.soc)) rel.push(occ)
      else rest.push(occ)
    }
    rel.sort((a, b) => {
      const ap = primary.has(a.soc) ? 0 : 1
      const bp = primary.has(b.soc) ? 0 : 1
      return ap === bp ? b.entrySalary - a.entrySalary : ap - bp
    })
    return { relevant: rel, other: rest }
  }, [occupations, cipCode, crosswalk])

  const visible = useMemo(
    () => (showAll ? [...relevant, ...other] : relevant),
    [showAll, relevant, other],
  )

  const sorted = useMemo(() => {
    const list = [...visible]
    list.sort((a, b) => {
      const av = sortValue(a, sortField, eloundouBySoc, aiImpactBySoc)
      const bv = sortValue(b, sortField, eloundouBySoc, aiImpactBySoc)
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDirection === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      const an = typeof av === 'number' ? av : Number.NEGATIVE_INFINITY
      const bn = typeof bv === 'number' ? bv : Number.NEGATIVE_INFINITY
      return sortDirection === 'asc' ? an - bn : bn - an
    })
    return list
  }, [visible, sortField, sortDirection, eloundouBySoc, aiImpactBySoc])

  const stats = useMemo(() => {
    if (!relevant.length) return null
    const avgSalary = relevant.reduce((s, o) => s + o.entrySalary, 0) / relevant.length
    const totalOpenings = relevant.reduce((s, o) => s + o.openPositions, 0)
    const growthVals = relevant
      .map((o) => o.projectedGrowthRate)
      .filter((v): v is number => v != null && !Number.isNaN(v))
    const avgGrowth =
      growthVals.length > 0 ? growthVals.reduce((s, v) => s + v, 0) / growthVals.length : 0
    const aiVals = relevant
      .map((o) => o.karpathyExposure)
      .filter((v): v is number => v != null && !Number.isNaN(v))
    const avgAi = aiVals.length > 0 ? aiVals.reduce((s, v) => s + v, 0) / aiVals.length : 0
    const withComp = relevant.filter((o) => o.graduatesPerOpening != null)
    const weight = withComp.reduce((s, o) => s + o.openPositions, 0)
    const avgCompetition =
      weight > 0
        ? withComp.reduce((s, o) => s + (o.graduatesPerOpening || 0) * o.openPositions, 0) /
          weight
        : null
    const eloundouVals = relevant
      .map((o) => eloundouBySoc.get(o.soc)?.gptBeta)
      .filter((v): v is number => v != null && !Number.isNaN(v))
    const avgEloundou =
      eloundouVals.length > 0
        ? eloundouVals.reduce((s, v) => s + v, 0) / eloundouVals.length
        : null
    return { avgSalary, totalOpenings, avgGrowth, avgAi, avgCompetition, avgEloundou }
  }, [relevant, eloundouBySoc])

  function onSort(field: TableSort) {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'title' ? 'asc' : 'desc')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted animate-pulse">Loading data...</div>
      </div>
    )
  }

  const displayName = major ? majorDisplayName(major.name) : cipCode
  const mapFrom = major ? `?from=${encodeURIComponent(major.cip)}#metros` : ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <DocumentMeta
        title={displayName}
        description={`BLS salaries, openings, AI-exposure, and Eloundou β (LLM task exposure) for careers linked to ${displayName}.`}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <Link
            to={home}
            className="text-sm text-muted hover:text-ink mb-1 inline-flex items-center min-h-11 py-2"
          >
            ← Back
          </Link>
          <h1 className="text-xl sm:text-3xl font-bold text-ink text-balance">{displayName}</h1>
          {major && <p className="text-sm text-muted mt-1">{major.category}</p>}
        </div>
        <div className="w-full sm:w-72 lg:w-80 shrink-0">
          <MajorSearch
            majors={majors}
            size="md"
            resultsBase={resultsBase}
            placeholder="Search your major..."
            tone={isDark ? 'dark' : 'light'}
          />
        </div>
      </div>

      {stats && (
        <TldrCard
          majorName={displayName}
          stats={stats}
          gameplanTo={gameplanHref(cipCode)}
        />
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <MetricCard
            label="Projected Openings"
            value={formatCompactCount(stats.totalOpenings)}
            sublabel="per year, BLS 2024–34"
          />
          <MetricCard
            label="Entry Salary"
            value={formatSalaryK(stats.avgSalary)}
            sublabel="BLS 25th percentile, averaged"
          />
          <MetricCard
            label="Competition"
            value={
              stats.avgCompetition == null ? 'N/A' : `${stats.avgCompetition.toFixed(1)}x`
            }
            sublabel="grads per opening, weighted by openings"
            positive={stats.avgCompetition != null && stats.avgCompetition < 1.5}
          />
          <MetricCard
            label="Eloundou β"
            value={stats.avgEloundou == null ? '—' : formatShare(stats.avgEloundou)}
            sublabel="LLM task exposure, GPT-4 ratings"
            positive={
              stats.avgEloundou == null
                ? undefined
                : stats.avgEloundou < 0.25
                  ? true
                  : stats.avgEloundou >= 0.65
                    ? false
                    : undefined
            }
          />
        </div>
      )}

      <div className="flex items-stretch mb-4">
        <div className="flex w-full sm:w-auto bg-surface border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className={`flex-1 sm:flex-none px-4 min-h-11 text-sm font-medium whitespace-nowrap transition-colors ${
              showAll ? 'text-muted hover:text-ink' : 'bg-primary text-white'
            }`}
          >
            Relevant ({relevant.length})
          </button>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className={`flex-1 sm:flex-none px-4 min-h-11 text-sm font-medium whitespace-nowrap transition-colors ${
              showAll ? 'bg-primary text-white' : 'text-muted hover:text-ink'
            }`}
          >
            All Jobs ({relevant.length + other.length})
          </button>
        </div>
      </div>

      {places.length > 0 && major ? (
        <section className="mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center justify-between gap-3 mb-2 px-0 sm:px-0">
            <p className="text-[11px] font-mono uppercase tracking-wider text-primary">
              Employers near you
            </p>
            <Link
              to={`${resultsBase}/${cipCode}/place`}
              className="text-xs text-primary hover:text-primary-bright shrink-0 min-h-11 inline-flex items-center"
            >
              Any ZIP
            </Link>
          </div>
          <ul className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none snap-x snap-mandatory">
            {places.map((p) => {
              const short = p.cbsaName.split('-')[0].split(',')[0].trim()
              return (
                <li key={p.zip} className="snap-start shrink-0">
                  <Link
                    to={`${resultsBase}/${cipCode}/${p.zip}`}
                    className="inline-flex flex-col justify-center min-h-12 min-w-[7.5rem] px-3 rounded-xl border border-border bg-surface text-ink hover:border-border-bright no-underline"
                  >
                    <span className="text-sm font-medium leading-tight">{short}</span>
                    <span className="font-mono text-[11px] text-muted mt-0.5">{p.zip}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <OccupationTable
        occupations={sorted}
        relevantSocs={new Set(relevant.map((o) => o.soc))}
        cipCode={cipCode}
        mapBase={mapBase}
        mapFrom={mapFrom}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        eloundouBySoc={eloundouBySoc}
        aiImpactBySoc={aiImpactBySoc}
      />

      <EvidenceBackMatter occupations={occupations} eloundouBySoc={eloundouBySoc} />
    </div>
  )
}

function MetricCard({
  label,
  value,
  sublabel,
  positive,
}: {
  label: string
  value: string
  sublabel?: string
  positive?: boolean
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 sm:p-5 hover:border-border-bright transition-colors min-w-0">
      <div className="text-[10px] sm:text-xs text-muted font-medium uppercase tracking-wider mb-1.5 sm:mb-2 leading-tight">
        {label}
      </div>
      <div
        className={`text-xl sm:text-3xl font-bold font-mono tabular-nums ${
          positive === true ? 'text-positive' : positive === false ? 'text-negative' : 'text-ink'
        }`}
      >
        {value}
      </div>
      {sublabel && <div className="text-[11px] sm:text-xs text-muted mt-1 leading-snug">{sublabel}</div>}
    </div>
  )
}

function TldrStat({ className, children }: { className: string; children: ReactNode }) {
  return (
    <strong className={`font-bold text-[1.4em] leading-none sm:whitespace-nowrap ${className}`}>
      {children}
    </strong>
  )
}

function TldrCard({
  majorName,
  stats,
  gameplanTo,
}: {
  majorName: string
  stats: {
    avgSalary: number
    totalOpenings: number
    avgGrowth: number
    avgAi: number
    avgCompetition: number | null
    avgEloundou: number | null
  }
  gameplanTo: string
}) {
  const name = majorName.replace(/,\s*general$/i, '')
  const ratio = stats.avgCompetition
  const growth = stats.avgGrowth
  const ai = stats.avgAi
  const aiLabel = `${Math.round(ai * 10) / 10}/10`

  const competition =
    ratio == null ? (
      <>competition (graduates per opening) is not available for these jobs</>
    ) : ratio < 0.05 ? (
      <>
        there are far more openings than graduates (
        <TldrStat className="text-positive">{ratio.toFixed(2)}×</TldrStat> grads per opening)
      </>
    ) : ratio < 1 ? (
      <>
        demand exceeds supply, at{' '}
        <TldrStat className="text-positive">{ratio.toFixed(1)}×</TldrStat> graduates per opening
      </>
    ) : ratio < 1.5 ? (
      <>
        the market is roughly in balance, at{' '}
        <TldrStat className="text-positive">{ratio.toFixed(1)}×</TldrStat> graduates per opening
      </>
    ) : ratio < 3 ? (
      <>
        the market is competitive, at{' '}
        <TldrStat className="text-warning">{ratio.toFixed(1)}×</TldrStat> graduates per opening
      </>
    ) : (
      <>
        supply is tight, at <TldrStat className="text-negative">{ratio.toFixed(1)}×</TldrStat>{' '}
        graduates per opening
      </>
    )

  const growthBit =
    growth >= 8 ? (
      <>
        Employment is projected to grow{' '}
        <TldrStat className="text-primary-bright">{formatGrowth(growth)}</TldrStat> by 2034
      </>
    ) : growth >= 2 ? (
      <>
        Employment is projected to grow{' '}
        <TldrStat className="text-primary-bright">{formatGrowth(growth)}</TldrStat> through 2034
      </>
    ) : growth >= 0 ? (
      <>
        Employment is projected to stay roughly flat (
        <TldrStat className="text-primary-bright">{formatGrowth(growth)}</TldrStat>)
      </>
    ) : (
      <>
        Employment is projected to decline{' '}
        <TldrStat className="text-negative">{formatGrowth(growth)}</TldrStat> by 2034
      </>
    )

  const aiBit =
    ai <= 3 ? (
      <>
        Average AI exposure is low at <TldrStat className="text-ink">{aiLabel}</TldrStat>
      </>
    ) : ai <= 5.5 ? (
      <>
        Average AI exposure is moderate at{' '}
        <TldrStat className="text-warning">{aiLabel}</TldrStat>
      </>
    ) : ai <= 7.5 ? (
      <>
        Average AI exposure is high at <TldrStat className="text-warning">{aiLabel}</TldrStat>
      </>
    ) : (
      <>
        Average AI exposure is very high at{' '}
        <TldrStat className="text-negative">{aiLabel}</TldrStat>
      </>
    )

  const beta = stats.avgEloundou
  const betaLabel = beta == null ? null : formatShare(beta)
  const eloundouBit =
    beta == null || betaLabel == null ? null : (
      <>
        Eloundou β — the share of tasks GPT-4 would cut by at least half — is{' '}
        <TldrStat
          className={beta < 0.25 ? 'text-ink' : beta < 0.65 ? 'text-warning' : 'text-negative'}
        >
          {betaLabel}
        </TldrStat>
      </>
    )

  const goods = [
    ratio != null && ratio < 1.5,
    growth >= 2,
    ai <= 4,
    beta != null && beta < 0.25,
  ].filter(Boolean).length
  const bads = [ratio != null && ratio >= 3, growth < 0, ai > 7, beta != null && beta >= 0.65].filter(
    Boolean,
  ).length
  const closer =
    goods >= 2 && bads === 0
      ? 'On these measures, conditions look relatively favorable.'
      : bads >= 2
        ? 'Several of these measures point to a tighter path into the field.'
        : 'The picture is mixed; the occupation table below is the better guide.'

  return (
    <div className="mb-6 bg-surface border border-border border-l-4 border-l-primary rounded-xl p-4 sm:p-6">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-3">
        Summary <span className="text-muted">— BLS, Karpathy, and Eloundou et al.</span>
      </div>
      <p className="font-serif font-light text-base sm:text-xl lg:text-2xl text-ink/90 leading-[1.7]">
        {name} graduates typically enter around{' '}
        <TldrStat className="text-positive">{formatSalaryK(stats.avgSalary)}</TldrStat>. Linked
        occupations account for about{' '}
        <TldrStat className="text-accent">{formatCompactCount(stats.totalOpenings)}</TldrStat>{' '}
        openings a year; {competition}. {growthBit}. {aiBit}
        {eloundouBit ? <>; {eloundouBit}</> : null}. {closer}
      </p>
      {gameplanTo ? (
        <a
          href={gameplanTo}
          className="inline-flex items-center justify-center gap-1.5 mt-5 bg-primary hover:bg-primary-bright text-white text-sm font-semibold rounded-lg px-4 min-h-11 w-full sm:w-auto transition-colors"
        >
          Build Your Gameplan
          <span aria-hidden>→</span>
        </a>
      ) : null}
    </div>
  )
}

function SortChevron({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <svg
      className={`w-3 h-3 inline-block ml-0.5 transition-transform ${
        active ? 'text-primary' : 'text-muted/50'
      } ${active && direction === 'asc' ? 'rotate-180' : ''}`}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden
    >
      <path d="M5 8l5 5 5-5H5z" />
    </svg>
  )
}

function OccupationTable({
  occupations,
  relevantSocs,
  cipCode,
  mapBase,
  mapFrom,
  sortField,
  sortDirection,
  onSort,
  eloundouBySoc,
  aiImpactBySoc,
}: {
  occupations: Occupation[]
  relevantSocs: Set<string>
  cipCode: string
  mapBase: string
  mapFrom: string
  sortField: TableSort
  sortDirection: SortDirection
  onSort: (f: TableSort) => void
  eloundouBySoc: Map<string, EloundouScore>
  aiImpactBySoc: Map<string, AiImpactScore>
}) {
  return (
    <>
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-min pb-1">
          {SORT_CHIPS.map((chip) => {
            const active = sortField === chip.field
            return (
              <button
                key={chip.field}
                type="button"
                onClick={() => onSort(chip.field)}
                className={`shrink-0 inline-flex items-center rounded-full px-3 min-h-11 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-muted hover:text-ink hover:border-border-bright'
                }`}
              >
                {chip.label}
                {active && <SortChevron active direction={sortDirection} />}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-muted mb-4 leading-relaxed">
        Salaries &amp; openings: BLS May 2024. Growth: BLS 2024–34. AI exposure: Karpathy/BLS OOH
        (2025) + Frey &amp; Osborne (2013). Eloundou β: Eloundou et al. (2023). {AOI_ATTRIBUTION}.
      </p>

      <div className="lg:hidden space-y-3">
        {occupations.map((occ) => (
          <OccCard
            key={occ.soc}
            occ={occ}
            isRelevant={relevantSocs.has(occ.soc)}
            cipCode={cipCode}
            mapBase={mapBase}
            mapFrom={mapFrom}
            eloundou={eloundouBySoc.get(occ.soc)}
            impact={aiImpactBySoc.get(occ.soc)}
          />
        ))}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm min-w-[1080px]">
          <thead>
            <tr className="border-b border-border">
              {COLUMNS.map((col) => {
                const label = col.why ? (
                  <HoverTip
                    maxWidth={260}
                    content={<p className="text-xs text-muted leading-relaxed">{col.why}</p>}
                  >
                    <span className="border-b border-dashed border-border-bright cursor-help">
                      {col.label}
                    </span>
                  </HoverTip>
                ) : (
                  <span>{col.label}</span>
                )
                return (
                  <th
                    key={col.field}
                    className={`px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-ink transition-colors select-none ${col.className || 'text-left'}`}
                    onClick={() => onSort(col.field)}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {label}
                      <SortChevron active={sortField === col.field} direction={sortDirection} />
                    </span>
                  </th>
                )
              })}
              <th className="px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider text-left">
                Map
              </th>
            </tr>
          </thead>
          <tbody>
            {occupations.map((occ) => (
              <tr
                key={occ.soc}
                className={`border-b border-border/50 hover:bg-surface-hover transition-colors ${
                  relevantSocs.has(occ.soc) ? '' : 'text-ink/70'
                }`}
              >
                <td className="px-3 py-3 align-top">
                  <div className="font-medium text-ink leading-snug">{sentenceCase(occ.title)}</div>
                  <div className="text-[11px] text-muted mt-0.5 font-mono">SOC {occ.soc}</div>
                </td>
                <td className="px-3 py-3 text-right align-top">
                  <div className="font-mono tabular-nums text-ink">{formatSalary(occ.entrySalary)}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    median {formatSalary(occ.medianSalary)}
                  </div>
                </td>
                <td className="px-3 py-3 text-right align-top font-mono tabular-nums text-openings">
                  {formatNumber(occ.openPositions)}
                </td>
                <td className="px-3 py-3 align-top">
                  <CompetitionCell
                    level={occ.competitionLevel}
                    ratio={occ.graduatesPerOpening}
                  />
                </td>
                <td className="px-3 py-3 align-top">
                  <AiRiskCell occ={occ} />
                </td>
                <td className="px-3 py-3 align-top">
                  <EloundouCell score={eloundouBySoc.get(occ.soc)} />
                </td>
                <td className="px-3 py-3 align-top">
                  <EntryBarrierCell impact={aiImpactBySoc.get(occ.soc)} />
                </td>
                <td className="px-3 py-3 align-top">
                  <Link
                    to={`${mapBase}/${occ.soc}${mapFrom}`}
                    className="text-ink underline underline-offset-2 hover:text-primary text-sm"
                  >
                    Map
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {occupations.length === 0 && (
        <div className="text-center py-12 text-muted">No occupations found</div>
      )}
    </>
  )
}

function OccCard({
  occ,
  isRelevant,
  cipCode,
  mapBase,
  mapFrom,
  eloundou,
  impact,
}: {
  occ: Occupation
  isRelevant: boolean
  cipCode: string
  mapBase: string
  mapFrom: string
  eloundou?: EloundouScore
  impact?: AiImpactScore
}) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-4 ${isRelevant ? '' : 'border-dashed'}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-medium text-ink leading-snug">{sentenceCase(occ.title)}</div>
          <div className="text-[11px] text-muted mt-0.5 font-mono">SOC {occ.soc}</div>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0 text-sm font-medium">
          <Link
            to={`${mapBase}/${occ.soc}${mapFrom}`}
            className="text-ink underline underline-offset-2 min-h-10 inline-flex items-center"
          >
            Map
          </Link>
          {gameplanHref(cipCode, occ.soc) ? (
            <a
              href={gameplanHref(cipCode, occ.soc)}
              className="text-primary hover:text-primary-bright min-h-10 inline-flex items-center"
            >
              Gameplan →
            </a>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <span className="text-muted text-xs">Entry salary</span>
          <div className="font-mono tabular-nums text-ink font-medium">
            {formatSalary(occ.entrySalary)}
          </div>
          <div className="text-[11px] text-muted">median {formatSalary(occ.medianSalary)}</div>
        </div>
        <div>
          <span className="text-muted text-xs">Openings</span>
          <div className="font-mono tabular-nums text-openings">{formatNumber(occ.openPositions)}</div>
        </div>
        <div>
          <span className="text-muted text-xs">Competition</span>
          <CompetitionCell level={occ.competitionLevel} ratio={occ.graduatesPerOpening} align="left" />
        </div>
        <div>
          <span className="text-muted text-xs">AI Risk</span>
          <AiRiskCell occ={occ} align="left" />
        </div>
        <div>
          <span className="text-muted text-xs">Eloundou β</span>
          <EloundouCell score={eloundou} align="left" />
        </div>
        <div>
          <span className="text-muted text-xs">Entry barrier</span>
          <EntryBarrierCell impact={impact} />
        </div>
      </div>
    </div>
  )
}

function CompetitionCell({
  level,
  ratio,
  align = 'start',
}: {
  level: Occupation['competitionLevel']
  ratio: number | null
  align?: 'start' | 'left'
}) {
  const color = COMPETITION_DOT[level || 'Unknown'] || COMPETITION_DOT.Unknown
  const copy = level ? COMPETITION_COPY[level] : null
  return (
    <HoverTip
      maxWidth={280}
      content={
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs font-semibold" style={{ color }}>
              {level || 'Unknown'} Competition
            </span>
          </div>
          {ratio != null && (
            <div className="text-xs text-ink mb-1.5 font-mono">
              {formatRatio(ratio)} graduates per opening per year
            </div>
          )}
          <p className="text-xs text-muted leading-relaxed">
            {copy?.blurb || 'Competition data unavailable for this occupation.'}
          </p>
          <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted">
            Based on annual graduates vs. BLS annual openings
          </div>
        </div>
      }
    >
      <div className={`flex flex-col gap-1 cursor-help ${align === 'left' ? 'items-start' : 'items-start'}`}>
        <span className="text-sm font-medium leading-none" style={{ color }}>
          {level || '—'}
        </span>
        {ratio != null && (
          <span className="text-[11px] text-muted leading-tight">
            {formatRatio(ratio)} grads per opening
          </span>
        )}
        <MiniBar pct={competitionFill(ratio)} color={color} />
      </div>
    </HoverTip>
  )
}

function AiRiskCell({ occ, align = 'start' }: { occ: Occupation; align?: 'start' | 'left' }) {
  const score = occ.karpathyExposure
  const band = aiBandLive(score)
  const color = AI_BAND_LIVE_COLORS[band]
  const rationale = occ.karpathyRationale || AI_BAND_LIVE_COPY[band]
  const pct = score != null ? Math.round((score / 10) * 100) : 0
  const barColor =
    pct >= 80 ? '#ef4444' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#6366f1' : '#10b981'

  return (
    <HoverTip
      maxWidth={320}
      content={
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-ink">AI Exposure</span>
            <span className="font-mono text-xs font-bold" style={{ color }}>
              {score}/10 · {band}
            </span>
          </div>
          <div className="mt-1.5 mb-2">
            <div className="flex justify-between text-[10px] text-muted mb-0.5">
              <span>Low</span>
              <span>High</span>
            </div>
            <div className="h-1.5 bg-inset rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed">{rationale}</p>
          {!occ.karpathyRationale && (
            <p className="text-[10px] text-muted italic mt-1">
              Band-level explanation; no per-title rationale available.
            </p>
          )}
          {occ.aiDisruptionScore != null && (
            <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted">
              Frey &amp; Osborne 2013 baseline: {occ.aiDisruptionScore}/100
              {occ.aiDisruptionLabel ? ` · ${occ.aiDisruptionLabel}` : ''}
            </div>
          )}
        </div>
      }
    >
      <div className={`flex flex-col gap-1 cursor-help ${align === 'left' ? 'items-start' : 'items-start'}`}>
        <span className="font-mono tabular-nums text-sm text-ink leading-none">
          {score != null ? `${Math.round(score)} of 10` : '—'}
        </span>
        <span className="text-[11px] font-medium leading-tight" style={{ color }}>
          {band}
        </span>
        {score != null && <MiniBar pct={pct} color={barColor} />}
      </div>
    </HoverTip>
  )
}

function EloundouCell({
  score,
  align = 'start',
}: {
  score?: EloundouScore
  align?: 'start' | 'left'
}) {
  if (!score || score.gptBeta == null) {
    return <span className="text-muted">—</span>
  }

  const band = score.band ?? '—'
  const color = ELOUNDOU_BAND_COLORS[band]
  const pct = Math.round(score.gptBeta * 100)

  return (
    <HoverTip
      maxWidth={340}
      content={
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-ink">Eloundou β</span>
            <span className="font-mono text-xs font-bold" style={{ color }}>
              {formatShare(score.gptBeta)} · {band}
            </span>
          </div>
          <div className="mt-1.5 mb-2">
            <div className="flex justify-between text-[10px] text-muted mb-0.5">
              <span>α {formatShare(score.gptAlpha)}</span>
              <span>γ {formatShare(score.gptGamma)}</span>
            </div>
            <div className="h-1.5 bg-inset rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
              />
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed">{ELOUNDOU_COPY}</p>
          <p className="text-xs text-muted leading-relaxed mt-2">{ELOUNDOU_ALPHA_COPY}</p>
          <p className="text-xs text-muted leading-relaxed mt-1">{ELOUNDOU_GAMMA_COPY}</p>
          <p className="text-[10px] text-muted mt-2">{ELOUNDOU_METHOD_COPY}</p>
          {score.humanBeta != null && (
            <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted">
              Human annotators: α {formatShare(score.humanAlpha)} · β{' '}
              {formatShare(score.humanBeta)} · γ {formatShare(score.humanGamma)}
            </div>
          )}
        </div>
      }
    >
      <div className={`flex flex-col gap-1 cursor-help ${align === 'left' ? 'items-start' : 'items-start'}`}>
        <span className="font-mono tabular-nums text-sm text-ink leading-none">
          {formatShare(score.gptBeta)}
        </span>
        <span className="text-[11px] text-muted leading-tight">
          α {formatShare(score.gptAlpha)} · γ {formatShare(score.gptGamma)}
        </span>
        <MiniBar pct={pct} color={color} />
      </div>
    </HoverTip>
  )
}

function EntryBarrierCell({ impact }: { impact?: AiImpactScore }) {
  if (!impact) {
    return (
      <HoverTip
        maxWidth={280}
        content={<p className="text-xs text-muted leading-relaxed">{ENTRY_BARRIER_COPY}</p>}
      >
        <span className="text-muted cursor-help">—</span>
      </HoverTip>
    )
  }

  const rising = impact.barrier === 'Rising'
  const flag = AI_FLAG_LABEL[impact.flag] ?? impact.flag

  return (
    <HoverTip
      maxWidth={300}
      content={
        <div>
          <p className="text-xs text-ink font-medium mb-1">
            {impact.barrier} · {flag}
          </p>
          <p className="text-xs text-muted leading-relaxed">{ENTRY_BARRIER_COPY}</p>
        </div>
      }
    >
      <div className="flex flex-col gap-0.5 cursor-help items-start">
        <span className={`text-sm font-medium leading-none ${rising ? 'text-warning' : 'text-positive'}`}>
          {impact.barrier}
        </span>
        <span className="text-[11px] text-muted leading-tight">{flag}</span>
      </div>
    </HoverTip>
  )
}

const EVIDENCE_ROWS = [
  {
    source: 'Frey and Osborne',
    vintage: '2013',
    measures: 'Probability an occupation is computerisable',
    question: 'Could this job be automated at all?',
  },
  {
    source: 'Eloundou α β γ',
    vintage: '2023',
    measures: 'Share of tasks exposed to LLMs, without tools and with',
    question: 'How much of the work can a model touch?',
  },
  {
    source: 'Karpathy / BLS OOH',
    vintage: '2025',
    measures: 'Composite exposure, LLM-scored vs OOH',
    question: 'Same question, newer scoring',
  },
  {
    source: 'Where You Work Matters',
    vintage: '2026, Gen-3',
    measures: 'Direction of travel on entry barriers and expertise value, by experience',
    question: 'Is it getting harder to get in, and does experience pay more than it used to?',
  },
] as const

function EvidenceBackMatter({
  occupations,
  eloundouBySoc,
}: {
  occupations: Occupation[]
  eloundouBySoc: Map<string, EloundouScore>
}) {
  const example = useMemo(() => {
    const occ =
      occupations.find((o) => o.soc === '15-1252') ??
      occupations.find((o) => /software developer/i.test(o.title))
    if (!occ) return null
    const el = eloundouBySoc.get(occ.soc)
    return {
      title: occ.title.toLowerCase(),
      ai: occ.karpathyExposure,
      beta: el?.gptBeta,
      ratio: occ.graduatesPerOpening,
    }
  }, [occupations, eloundouBySoc])

  return (
    <section className="mt-12 sm:mt-16 pt-8 border-t border-border">
      <h2 className="font-serif text-xl sm:text-2xl text-ink text-balance mb-5">
        Where this sits alongside the evidence already on the page.
      </h2>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Source
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Vintage
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  What it measures
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Question it answers
                </th>
              </tr>
            </thead>
            <tbody>
              {EVIDENCE_ROWS.map((row) => (
                <tr key={row.source} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink align-top whitespace-nowrap">
                    {row.source}
                  </td>
                  <td className="px-4 py-3 text-muted align-top whitespace-nowrap">{row.vintage}</td>
                  <td className="px-4 py-3 text-ink/80 align-top">{row.measures}</td>
                  <td className="px-4 py-3 text-ink/80 align-top">{row.question}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y divide-border">
          {EVIDENCE_ROWS.map((row) => (
            <div key={row.source} className="p-4">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <div className="font-medium text-ink">{row.source}</div>
                <div className="text-xs text-muted shrink-0">{row.vintage}</div>
              </div>
              <p className="text-sm text-ink/80 leading-relaxed">{row.measures}</p>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{row.question}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-surface border border-border rounded-xl p-4 sm:p-5">
        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-2">
          Read against one row
        </div>
        <p className="text-sm sm:text-base text-ink/85 leading-relaxed">
          {example ? (
            <>
              {example.title} sit at{' '}
              {example.ai != null ? `${example.ai.toFixed(1)} of 10` : '—'} AI Risk and{' '}
              {example.beta != null ? formatShare(example.beta) : '—'} Eloundou β
              {example.ratio != null ? (
                <>
                  , with {formatRatio(example.ratio)} graduates per opening — heavily exposed, and
                  relatively easier to hire into.
                </>
              ) : (
                <> — heavily exposed on the LLM measures.</>
              )}{' '}
              WYWM is the only measure on this page split by experience: whether the door is
              rising or falling, and whether the expertise premium is widening.
            </>
          ) : (
            <>
              Software developers, in the snapshot this layout was designed against, sit at 8.3 of
              10 AI Risk and 87% Eloundou β, with 0.72 graduates per opening — heavily exposed, and
              relatively easier to hire into. WYWM is the only measure on this page split by
              experience: whether the door is rising or falling, and whether the expertise premium
              is widening.
            </>
          )}
        </p>
      </div>
    </section>
  )
}

function sortValue(
  occ: Occupation,
  field: TableSort,
  eloundouBySoc: Map<string, EloundouScore>,
  aiImpactBySoc: Map<string, AiImpactScore>,
): string | number | null {
  if (field === 'eloundouBeta') return eloundouBySoc.get(occ.soc)?.gptBeta ?? null
  if (field === 'entryBarrier') {
    const b = aiImpactBySoc.get(occ.soc)?.barrier
    return b === 'Rising' ? 1 : b === 'Falling' ? 0 : null
  }
  const value = occ[field]
  return typeof value === 'number' || typeof value === 'string' ? value : null
}
