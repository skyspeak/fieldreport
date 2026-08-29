import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { scaleSequential } from 'd3-scale'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Geometry } from 'geojson'
import { useData } from '../data/DataContext'
import { BackLink } from '../components/BackLink'
import { DigestSignup } from '../components/DigestSignup'
import { DocumentMeta } from '../components/DocumentMeta'
import { InfoTip } from '../components/InfoTip'
import { ShareSheet } from '../components/ShareSheet'
import { formatNumber, formatSalary, formatShare } from '../lib/format'
import { AI_BAND_COPY, ELOUNDOU_COPY, aiBandFromScore } from '../lib/labels'
import { assetUrl } from '../lib/assetUrl'
import { isRealMajor } from '../lib/majorName'
import { useAppPaths } from '../lib/useAppPaths'
import { loadPlaces } from '../lib/v3/data'
import type { PlaceRow } from '../lib/v3/types'
import type { MapColorBy } from '../types'

interface StateProps {
  name?: string
}

const FIPS_TO_ABBR: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO',
  '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI',
  '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
  '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
  '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
  '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY',
}

const NAME_TO_ABBR: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC',
  Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
  Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA',
  Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
  Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY',
}

export function MapPage() {
  const { socCode = '' } = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { majors, occupationsBySoc, eloundouBySoc, stateData, loading, loadStateData } =
    useData()
  const { home, resultsBase } = useAppPaths()
  const [colorBy, setColorBy] = useState<MapColorBy>('employment')
  const [selected, setSelected] = useState<string | null>(null)
  const [topo, setTopo] = useState<FeatureCollection<Geometry, StateProps> | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [places, setPlaces] = useState<PlaceRow[]>([])

  const fromCip = searchParams.get('from') ?? ''
  const fromMajor =
    fromCip && isRealMajor(fromCip) ? majors.find((m) => m.cip === fromCip) : undefined
  const backToResults = fromMajor ? `${resultsBase}/${fromMajor.cip}` : home
  const backLabel = fromMajor
    ? `← Back to ${fromMajor.name}`
    : '← Back to search'
  const wantMetros = location.hash === '#metros'

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

  useEffect(() => {
    if (!wantMetros || !fromMajor || places.length === 0) return
    const id = window.setTimeout(() => {
      document.getElementById('metros')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => window.clearTimeout(id)
  }, [wantMetros, fromMajor, places.length, socCode])

  const occupation = occupationsBySoc.get(socCode)
  const eloundou = eloundouBySoc.get(socCode)

  useEffect(() => {
    void loadStateData()
  }, [loadStateData])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch(assetUrl('us-states-topo.json'), {
        cache: import.meta.env.DEV ? 'no-cache' : 'force-cache',
      })
      const raw = (await res.json()) as Topology<{ states: GeometryCollection }>
      const obj = raw.objects.states ?? Object.values(raw.objects)[0]
      const fc = feature(raw, obj) as unknown as FeatureCollection<Geometry, StateProps>
      if (!cancelled) setTopo(fc)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const values = useMemo(() => {
    const map: Record<string, number> = {}
    if (!stateData || !occupation) return map
    const exposure = (occupation.karpathyExposure ?? 0) / 10
    for (const [abbr, state] of Object.entries(stateData)) {
      const cell = state.occupations[socCode]
      if (!cell) continue
      if (colorBy === 'employment') map[abbr] = cell.employment
      else if (colorBy === 'salary') map[abbr] = cell.medianSalary
      else map[abbr] = cell.employment * exposure
    }
    return map
  }, [stateData, occupation, socCode, colorBy])

  const colorScale = useMemo(() => {
    const nums = Object.values(values).filter((v) => v > 0)
    const min = nums.length ? Math.min(...nums) : 0
    const max = nums.length ? Math.max(...nums) : 1
    const interpolator =
      colorBy === 'aiImpact'
        ? (t: number) => `rgb(${Math.round(40 + t * 200)}, ${Math.round(30 + (1 - t) * 40)}, ${Math.round(40 + (1 - t) * 40)})`
        : colorBy === 'salary'
          ? (t: number) => `rgb(${Math.round(30 + t * 40)}, ${Math.round(80 + t * 120)}, ${Math.round(90 + t * 80)})`
          : (t: number) => `rgb(${Math.round(40 + t * 180)}, ${Math.round(50 + t * 60)}, ${Math.round(80 + (1 - t) * 40)})`
    return scaleSequential(interpolator).domain([min, max || 1])
  }, [values, colorBy])

  const paths = useMemo(() => {
    if (!topo) return []
    const projection = geoAlbersUsa().fitSize([960, 560], topo)
    const path = geoPath(projection)
    return topo.features.map((f) => {
      const id = String(f.id ?? '')
      const abbr =
        FIPS_TO_ABBR[id.padStart(2, '0')] ||
        FIPS_TO_ABBR[id] ||
        guessAbbr(f.properties?.name)
      const d = path(f) ?? ''
      return { abbr, name: f.properties?.name ?? abbr, d }
    })
  }, [topo])

  const ranked = useMemo(() => {
    return Object.entries(values)
      .map(([abbr, value]) => ({
        abbr,
        value,
        name: stateData?.[abbr]?.name ?? abbr,
        employment: stateData?.[abbr]?.occupations[socCode]?.employment ?? 0,
        salary: stateData?.[abbr]?.occupations[socCode]?.medianSalary ?? 0,
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [values, stateData, socCode])

  const rankByAbbr = useMemo(() => {
    const map = new Map<string, number>()
    ranked.forEach((r, i) => map.set(r.abbr, i + 1))
    return map
  }, [ranked])

  const activeAbbr = selected ?? hover
  const active = activeAbbr
    ? {
        abbr: activeAbbr,
        name: stateData?.[activeAbbr]?.name ?? activeAbbr,
        employment: stateData?.[activeAbbr]?.occupations[socCode]?.employment ?? 0,
        salary: stateData?.[activeAbbr]?.occupations[socCode]?.medianSalary ?? 0,
        value: values[activeAbbr] ?? 0,
        rank: rankByAbbr.get(activeAbbr) ?? 0,
      }
    : null

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-muted">Loading map data...</div>
  }

  if (!occupation) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <DocumentMeta title="Occupation not found" />
        <BackLink to={backToResults}>{backLabel}</BackLink>
        <h1 className="font-serif text-3xl text-ink">Occupation not found</h1>
      </div>
    )
  }

  const aiBand = aiBandFromScore(occupation.karpathyExposure)
  const aiTip =
    occupation.karpathyRationale ||
    AI_BAND_COPY[aiBand] ||
    'AI Risk is a 0–10 exposure score for how much of this job LLMs can already do.'

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
      <DocumentMeta
        title={occupation.title}
        description={`State map for ${occupation.title} with BLS wages, AI Risk, and Eloundou β.`}
      />
      <BackLink to={backToResults}>{backLabel}</BackLink>

      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2">
            SOC {occupation.soc}
          </p>
          <h1 className="font-serif text-2xl sm:text-4xl text-ink tracking-tight text-balance">
            {occupation.title}
          </h1>
          <p className="text-muted mt-3 max-w-xl text-sm sm:text-base leading-relaxed">
            {fromMajor
              ? `State employment for this job, plus who hires ${fromMajor.name} in seed metros.`
              : 'Pick a state for employment and salary. Color by employment, median salary, or jobs × AI exposure.'}
          </p>
        </div>
        <div className="shrink-0 w-full sm:w-auto sm:pt-6">
          <ShareSheet
            title={occupation.title}
            summary={`State map for ${occupation.title} with BLS wages, AI Risk, and Eloundou β — from dear[CC] Field report.`}
          />
        </div>
      </div>

      {fromMajor ? (
        <SeedMetros
          cip={fromMajor.cip}
          majorName={fromMajor.name}
          places={places}
          resultsBase={resultsBase}
        />
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2.5 sm:gap-4 text-sm w-full mb-6">
        <Metric label="Entry Salary" value={formatSalary(occupation.entrySalary)} />
        <Metric label="Median Salary" value={formatSalary(occupation.medianSalary)} />
        <Metric label="Total Employment" value={formatNumber(occupation.totalEmployment)} />
        <Metric label="Annual Openings" value={formatNumber(occupation.openPositions)} />
        <Metric
          label="AI Risk"
          value={
            occupation.karpathyExposure != null ? `${occupation.karpathyExposure}/10` : '—'
          }
          tip={aiTip}
        />
        <Metric
          label="Eloundou β"
          value={eloundou?.gptBeta != null ? formatShare(eloundou.gptBeta) : '—'}
          tip={ELOUNDOU_COPY}
        />
      </div>

      <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 mb-6 text-sm overflow-x-auto overscroll-x-contain pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        <span className="text-muted shrink-0">Color by:</span>
        {(
          [
            ['employment', 'Employment'],
            ['salary', 'Salary'],
            ['aiImpact', 'AI Impact'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setColorBy(key)}
            className={`shrink-0 rounded-lg px-3 py-2.5 sm:py-1.5 transition-colors min-h-11 sm:min-h-0 whitespace-nowrap ${
              colorBy === key
                ? 'bg-primary text-white'
                : 'text-muted hover:text-ink bg-card border border-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="lg:hidden mb-6">
        <label htmlFor="state-select" className="sr-only">
          Choose a state
        </label>
        <select
          id="state-select"
          className="w-full min-h-12 rounded-xl border border-border-bright bg-card px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          value={selected ?? ''}
          onChange={(e) => setSelected(e.target.value || null)}
        >
          <option value="">Choose a state…</option>
          {ranked.map((r) => (
            <option key={r.abbr} value={r.abbr}>
              {r.name}
            </option>
          ))}
        </select>

        <ul className="rounded-xl border border-border bg-card divide-y divide-border max-h-[min(24rem,50vh)] overflow-auto">
          {ranked.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted text-center">
              {!stateData ? 'Loading state data…' : 'No state data for this occupation.'}
            </li>
          ) : (
            ranked.map((r, i) => {
              const isActive = selected === r.abbr
              return (
                <li key={r.abbr}>
                  <button
                    type="button"
                    onClick={() => setSelected(r.abbr)}
                    className={`w-full text-left px-4 py-3.5 min-h-12 flex items-center justify-between gap-3 transition-colors ${
                      isActive ? 'bg-primary/10' : 'hover:bg-surface'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="text-xs font-mono text-muted mr-2">#{i + 1}</span>
                      <span className="font-medium text-ink">{r.name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-sm text-ink/80 tabular-nums">
                      {colorBy === 'salary'
                        ? formatSalary(r.salary)
                        : colorBy === 'aiImpact'
                          ? formatNumber(r.value)
                          : formatNumber(r.employment)}
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>

        {active && (
          <div className="mt-4 rounded-xl border border-border bg-card p-5">
            <StateDetail active={active} rankedCount={ranked.length} colorBy={colorBy} />
          </div>
        )}
      </div>

      <div className="hidden lg:grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="bg-card border border-border rounded-xl p-3 sm:p-5 overflow-hidden">
          {!stateData || !topo ? (
            <p className="text-muted py-20 text-center">Loading map data...</p>
          ) : (
            <svg viewBox="0 0 960 560" className="w-full h-auto" role="img" aria-label="US map">
              {paths.map((p) => {
                const v = values[p.abbr] ?? 0
                const fill = v > 0 ? colorScale(v) : 'var(--color-border)'
                const isActive = activeAbbr === p.abbr
                return (
                  <path
                    key={p.abbr || p.name}
                    d={p.d}
                    fill={fill}
                    stroke={isActive ? 'var(--color-ink)' : 'var(--color-card)'}
                    strokeWidth={isActive ? 2 : 0.75}
                    className="cursor-pointer transition-[stroke-width] focus:outline-none focus-visible:stroke-ink"
                    role="button"
                    tabIndex={0}
                    aria-label={p.name}
                    onMouseEnter={() => setHover(p.abbr)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(p.abbr)}
                    onBlur={() => setHover(null)}
                    onClick={() => setSelected(p.abbr)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelected(p.abbr)
                      }
                    }}
                  >
                    <title>{p.name}</title>
                  </path>
                )
              })}
            </svg>
          )}
          <Legend colorBy={colorBy} values={Object.values(values).filter((v) => v > 0)} />
        </div>

        <aside className="bg-card border border-border rounded-xl p-5 h-fit">
          {active ? (
            <StateDetail active={active} rankedCount={ranked.length} colorBy={colorBy} />
          ) : (
            <p className="text-muted text-sm leading-relaxed">
              Click a state to see employment and salary for{' '}
              {occupation.title.toLowerCase()}.
            </p>
          )}
        </aside>
      </div>

      <DigestSignup
        industry="Career exploration"
        role={occupation.title}
        focusAreas={[occupation.title, 'AI literacy', 'labor market']}
        sourceRef={`soc:${occupation.soc}`}
      />
    </div>
  )
}

function shortMetro(name: string) {
  return name.split('-')[0].split(',')[0].trim()
}

function SeedMetros({
  cip,
  majorName,
  places,
  resultsBase,
}: {
  cip: string
  majorName: string
  places: PlaceRow[]
  resultsBase: string
}) {
  const navigate = useNavigate()
  const [zip, setZip] = useState('')
  const [zipError, setZipError] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const cleaned = zip.replace(/\D/g, '').slice(0, 5)
    if (!/^\d{5}$/.test(cleaned)) {
      setZipError(true)
      return
    }
    setZipError(false)
    navigate(`${resultsBase}/${cip}/${cleaned}`)
  }

  return (
    <section
      id="metros"
      className="mb-8 scroll-mt-28 rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-wider text-primary">
            Employers by metro
          </p>
          <h2 className="mt-1 font-serif text-xl sm:text-2xl text-ink leading-tight text-balance">
            Who hires {majorName}
          </h2>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {places.map((p) => (
          <li key={p.zip}>
            <Link
              to={`${resultsBase}/${cip}/${p.zip}`}
              className="flex flex-col justify-center min-h-12 rounded-xl border border-border bg-page px-3 py-2.5 hover:border-border-bright transition-colors no-underline text-ink active:scale-[0.99]"
            >
              <span className="font-medium text-sm leading-snug truncate">
                {shortMetro(p.cbsaName)}
              </span>
              <span className="text-[11px] text-muted font-mono mt-0.5">{p.zip}</span>
            </Link>
          </li>
        ))}
      </ul>

      <form
        onSubmit={onSubmit}
        className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-stretch max-w-sm"
      >
        <label className="sr-only" htmlFor="map-zip">
          ZIP code
        </label>
        <input
          id="map-zip"
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="\d{5}"
          maxLength={5}
          value={zip}
          onChange={(e) => {
            setZip(e.target.value.replace(/\D/g, '').slice(0, 5))
            setZipError(false)
          }}
          aria-invalid={zipError}
          className={`flex-1 min-h-12 rounded-xl border bg-page px-4 font-mono tracking-wider text-base sm:text-sm ${
            zipError ? 'border-negative' : 'border-border'
          }`}
          placeholder="ZIP"
        />
        <button
          type="submit"
          className="min-h-12 px-5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-bright shrink-0"
        >
          Go
        </button>
      </form>
      {zipError ? (
        <p className="mt-2 text-xs text-negative">Enter a 5-digit U.S. ZIP.</p>
      ) : null}
    </section>
  )
}

function StateDetail({
  active,
  rankedCount,
  colorBy,
}: {
  active: {
    name: string
    employment: number
    salary: number
    value: number
    rank: number
  }
  rankedCount: number
  colorBy: MapColorBy
}) {
  return (
    <>
      <h2 className="font-serif text-2xl text-ink">{active.name}</h2>
      <p className="text-xs text-muted font-mono mt-1">
        #{active.rank || '—'} of {rankedCount || '—'}
      </p>
      <dl className="mt-6 space-y-4 text-sm">
        <div>
          <dt className="text-muted">Employment</dt>
          <dd className="font-mono text-lg text-ink mt-0.5">
            {formatNumber(active.employment)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Median salary</dt>
          <dd className="font-mono text-lg text-ink mt-0.5">
            {formatSalary(active.salary)}
          </dd>
        </div>
        {colorBy === 'aiImpact' && (
          <div>
            <dt className="text-muted">AI impact</dt>
            <dd className="font-mono text-lg text-ink mt-0.5">
              {formatNumber(active.value)}
            </dd>
            <p className="text-xs text-muted mt-1">state employment × AI exposure / 10</p>
          </div>
        )}
      </dl>
    </>
  )
}

function Metric({
  label,
  value,
  tip,
}: {
  label: string
  value: string
  tip?: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl px-3 sm:px-4 py-3 min-w-0 sm:min-w-[120px] flex-1 sm:flex-none">
      <div className="text-xs text-muted uppercase tracking-wider leading-snug inline-flex items-center min-w-0 max-w-full">
        <span className="truncate">{label}</span>
        {tip && <InfoTip label={label}>{tip}</InfoTip>}
      </div>
      <div className="font-mono text-ink mt-1 text-sm sm:text-base tabular-nums break-words">
        {value}
      </div>
    </div>
  )
}

function Legend({ colorBy, values }: { colorBy: MapColorBy; values: number[] }) {
  if (values.length === 0) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const label =
    colorBy === 'salary'
      ? 'Median Salary'
      : colorBy === 'aiImpact'
        ? 'Jobs at AI risk'
        : 'Employment'

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
      <span className="shrink-0">{label}</span>
      <div
        className="h-2 flex-1 min-w-[6rem] max-w-48 rounded-full"
        style={{
          background:
            colorBy === 'aiImpact'
              ? 'linear-gradient(90deg, #281e28, #e84628)'
              : colorBy === 'salary'
                ? 'linear-gradient(90deg, #1e5060, #46d0aa)'
                : 'linear-gradient(90deg, #283250, #dc7846)',
        }}
      />
      <span className="font-mono text-xs tabular-nums">
        {colorBy === 'salary' ? formatSalary(min) : formatNumber(min)} –{' '}
        {colorBy === 'salary' ? formatSalary(max) : formatNumber(max)}
      </span>
    </div>
  )
}

function guessAbbr(name?: string): string {
  if (!name) return ''
  return NAME_TO_ABBR[name] ?? ''
}
