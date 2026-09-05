import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatNumber, formatSalary } from '../../lib/format'
import { useData } from '../../data/DataContext'
import {
  fetchBadges,
  fetchCompare,
  fetchIndustries,
  fetchPathways,
  fetchVersus,
  type BadgesPayload,
  type ComparePayload,
  type IndustriesPayload,
  type PathwayRow,
  type PathwaysPayload,
  type VersusPayload,
} from '../../lib/v4/data'
import { Coverage, V4Frame } from './V4Frame'

function useMajorName(cip: string) {
  const { majors } = useData()
  return majors.find((m) => m.cip === cip)?.name
}

export function V4ComparePage() {
  const { cipCode = '', zipA = '94402', zipB = '10001' } = useParams()
  const majorName = useMajorName(cipCode)
  const [data, setData] = useState<ComparePayload | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStatus('loading')
      try {
        const payload = await fetchCompare(cipCode, zipA, zipB)
        if (!cancelled) {
          setData(payload)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed')
          setStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cipCode, zipA, zipB])

  const pairs = [
    ['94402', '10001', 'SF vs NYC'],
    ['94402', '98101', 'SF vs Seattle'],
    ['60601', '77002', 'Chicago vs Houston'],
    ['02108', '30301', 'Boston vs Atlanta'],
  ] as const

  return (
    <V4Frame
      option="D"
      title={majorName || data?.cip.title || cipCode}
      kicker={`${zipA} vs ${zipB}`}
      subtitle="Same degree, two metros — rated hiring, Platinum share, and who shows up."
      loading={status === 'loading'}
      loadingHint="Comparing two metros. First load pulls both ZIP reports."
      error={status === 'error' ? error : null}
    >
      {data ? (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {pairs.map(([a, b, label]) => (
              <Link
                key={`${a}-${b}`}
                to={`/v4/compare/${cipCode}/${a}/${b}`}
                className={`text-sm min-h-11 px-3 rounded-full border inline-flex items-center ${
                  zipA === a && zipB === b
                    ? 'border-primary text-primary'
                    : 'border-border text-muted hover:text-ink'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <MetroCol side={data.left} cip={cipCode} />
            <MetroCol side={data.right} cip={cipCode} />
          </div>
          <Coverage text={data.coverage.text} source={data.coverage.source} />
        </>
      ) : null}
    </V4Frame>
  )
}

function MetroCol({
  side,
  cip,
}: {
  side: ComparePayload['left']
  cip: string
}) {
  const short = side.place.cbsaName.split('-')[0].split(',')[0].trim()
  return (
    <section className="rounded-xl border border-border bg-card px-5 py-5">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">
        {side.place.zip}
      </p>
      <h2 className="mt-1 font-sans font-bold tracking-tight text-2xl text-ink">{short}</h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-sm tabular-nums">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted font-sans">
            Hiring here
          </dt>
          <dd className="mt-1 text-xl text-primary">{formatNumber(side.funnel.hiringHere)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted font-sans">
            Platinum
          </dt>
          <dd className="mt-1 text-xl text-ink">{formatNumber(side.platinum)}</dd>
        </div>
      </dl>
      {side.atlas ? (
        <p className="mt-2 text-xs text-muted">
          Atlas count for this metro: {side.atlas.employers} rated
        </p>
      ) : null}
      <ol className="mt-5 space-y-2">
        {side.employers.map((e, i) => (
          <li key={e.name} className="text-sm">
            <Link
              to={`/v4/company/${cip}/${encodeURIComponent(e.name)}`}
              className="text-ink hover:text-primary"
            >
              <span className="font-mono text-xs text-muted mr-2">
                {String(i + 1).padStart(2, '0')}
              </span>
              {e.name}
            </Link>
            <span className="text-muted"> · {e.badge}</span>
          </li>
        ))}
      </ol>
      {side.groups[0]?.door ? (
        <p className="mt-4 text-sm text-ink/80">{side.groups[0].door.heading}</p>
      ) : null}
      <p className="mt-4 text-sm">
        <Link
          to={`/v4/results/${cip}/${side.place.zip}`}
          className="text-ink underline underline-offset-2 hover:text-primary"
        >
          Full report →
        </Link>
      </p>
    </section>
  )
}

export function V4PathwaysPage() {
  const { cipCode = '' } = useParams()
  const majorName = useMajorName(cipCode)
  const [data, setData] = useState<PathwaysPayload | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStatus('loading')
      try {
        const payload = await fetchPathways(cipCode)
        if (!cancelled) {
          setData(payload)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed')
          setStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cipCode])

  return (
    <V4Frame
      option="E"
      title={majorName || data?.cip.title || cipCode}
      kicker="pathways"
      subtitle="Where skills overlap, and where people in this field actually move next."
      loading={status === 'loading'}
      loadingHint="Loading adjacent and destination clusters…"
      error={status === 'error' ? error : null}
    >
      {data ? (
        <>
          {data.groups.map((g) => (
            <section key={g.groupId} className="mt-12">
              <h2 className="font-sans font-bold tracking-tight text-2xl text-ink">{g.displayName}</h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <PathCol heading="Skill-adjacent" rows={g.adjacent} />
                <PathCol heading="Common next roles" rows={g.destinations} />
              </div>
            </section>
          ))}
          <Coverage text={data.coverage.text} source={data.coverage.source} />
        </>
      ) : null}
    </V4Frame>
  )
}

function PathCol({ heading, rows }: { heading: string; rows: PathwayRow[] }) {
  return (
    <div>
      <h3 className="font-mono text-xs uppercase tracking-wider text-muted">{heading}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No clusters returned for this snapshot.</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {rows.map((r) => (
            <li key={r.clusterId} className="border-t border-border pt-3">
              <p className="font-sans font-bold tracking-tight text-lg text-ink">{r.name}</p>
              <p className="mt-1 text-xs text-muted">
                {[r.jobLevel, r.aiFlag].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-2 text-sm text-ink/80">
                {r.internalPct != null ? `${r.internalPct}% stay to move up` : 'Promotion n/a'}
                {r.externalPct != null ? ` · ${r.externalPct}% leave to move up` : ''}
                {r.retentionPct != null ? ` · ${r.retentionPct}% still there at 3 years` : ''}
              </p>
              {r.skills.length ? (
                <p className="mt-1 text-xs text-muted">{r.skills.join(' · ')}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function V4BadgesPage() {
  const { cipCode = '' } = useParams()
  const majorName = useMajorName(cipCode)
  const [data, setData] = useState<BadgesPayload | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStatus('loading')
      try {
        const payload = await fetchBadges(cipCode)
        if (!cancelled) {
          setData(payload)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed')
          setStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cipCode])

  return (
    <V4Frame
      option="F"
      title={majorName || data?.cip.title || cipCode}
      kicker={data ? `cluster ${data.cluster.id}` : 'badges'}
      subtitle="WYWM 3×3: early-career, growth, and stability × Platinum / Gold for this field."
      loading={status === 'loading'}
      loadingHint="Rolling up occupation-badge pairs…"
      error={status === 'error' ? error : null}
    >
      {data ? (
        <>
          <p className="mt-3 text-sm text-muted">{data.cluster.name}</p>
          <BadgeGrid matrix={data.matrix} />
          {data.groupMatrices.map((g) =>
            g.matrix ? (
              <div key={g.clusterId} className="mt-10">
                <h2 className="font-sans font-bold tracking-tight text-xl text-ink">{g.name}</h2>
                <BadgeGrid matrix={g.matrix} compact />
              </div>
            ) : null,
          )}
          <section className="mt-12 max-w-3xl">
            <h2 className="font-sans font-bold tracking-tight text-2xl text-ink">Platinum + high entry hiring</h2>
            <ol className="mt-4 space-y-2">
              {data.platinumHigh.map((r, i) => (
                <li key={`${r.company}-${i}`} className="text-sm">
                  <Link
                    to={`/v4/company/${cipCode}/${encodeURIComponent(r.company)}`}
                    className="text-ink hover:text-primary"
                  >
                    {r.company}
                  </Link>
                  <span className="text-muted">
                    {r.industry ? ` · ${r.industry}` : ''}
                    {r.badgeGrowth ? ` · growth ${r.badgeGrowth}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <Coverage text={data.coverage.text} source={data.coverage.source} />
        </>
      ) : null}
    </V4Frame>
  )
}

function BadgeGrid({
  matrix,
  compact,
}: {
  matrix: BadgesPayload['matrix']
  compact?: boolean
}) {
  if (!matrix) return <p className="mt-4 text-sm text-muted">No badge matrix for this cluster.</p>
  const rows = [
    ['Early career', matrix.early_career],
    ['Growth', matrix.growth],
    ['Stability', matrix.stability],
  ] as const
  return (
    <div className={`mt-6 overflow-x-auto ${compact ? 'max-w-xl' : 'max-w-2xl'}`}>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted">
            <th className="py-2 font-normal">Archetype</th>
            <th className="py-2 font-normal">Platinum</th>
            <th className="py-2 font-normal">Gold</th>
            <th className="py-2 font-normal">Ranked</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, t]) => (
            <tr key={label} className="border-t border-border">
              <td className="py-3 text-ink">{label}</td>
              <td className="py-3 font-mono tabular-nums text-ink">
                {formatNumber(t.platinum)}
              </td>
              <td className="py-3 font-mono tabular-nums">{formatNumber(t.gold)}</td>
              <td className="py-3 font-mono tabular-nums text-muted">{formatNumber(t.ranked)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function V4VersusPage() {
  const { cipA = '11.0701', cipB = '51.3801' } = useParams()
  const nameA = useMajorName(cipA)
  const nameB = useMajorName(cipB)
  const [data, setData] = useState<VersusPayload | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStatus('loading')
      try {
        const payload = await fetchVersus(cipA, cipB)
        if (!cancelled) {
          setData(payload)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed')
          setStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cipA, cipB])

  const duels = [
    ['11.0701', '51.3801', 'CS vs Nursing'],
    ['11.0701', '46.0302', 'CS vs Electrician'],
    ['52.0301', '45.0601', 'Accounting vs Economics'],
  ] as const

  return (
    <V4Frame
      option="G"
      title={`${nameA || data?.left.cip.title || cipA} vs ${nameB || data?.right.cip.title || cipB}`}
      kicker="major vs major"
      subtitle="National AOI snapshot: pay, AI door, rated pairs, and who hires."
      loading={status === 'loading'}
      loadingHint="Resolving both majors and pulling wages, badges, and employers…"
      error={status === 'error' ? error : null}
    >
      {data ? (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {duels.map(([a, b, label]) => (
              <Link
                key={`${a}-${b}`}
                to={`/v4/versus/${a}/${b}`}
                className={`text-sm min-h-11 px-3 rounded-full border inline-flex items-center ${
                  cipA === a && cipB === b
                    ? 'border-primary text-primary'
                    : 'border-border text-muted hover:text-ink'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <VersusCol side={data.left} />
            <VersusCol side={data.right} />
          </div>
          <Coverage text={data.coverage.text} source={data.coverage.source} />
        </>
      ) : null}
    </V4Frame>
  )
}

function VersusCol({ side }: { side: VersusPayload['left'] }) {
  return (
    <section className="rounded-xl border border-border bg-card px-5 py-5">
      <p className="font-mono text-xs uppercase tracking-wider text-muted">{side.cip.code}</p>
      <h2 className="mt-1 font-sans font-bold tracking-tight text-2xl text-ink">{side.cip.title}</h2>
      <p className="mt-1 text-sm text-muted">{side.cluster.name}</p>
      <dl className="mt-5 space-y-3">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted">Entry median</dt>
          <dd className="font-mono text-xl text-primary">{formatSalary(side.wages.entry)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted">Year 10 median</dt>
          <dd className="font-mono text-lg text-ink">{formatSalary(side.wages.year10)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted">AI flag</dt>
          <dd className="text-ink">
            {side.ai?.flag || 'Not assessed'}
            {side.ai?.barrier ? ` · barrier ${side.ai.barrier}` : ''}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-muted">
            Rated early-career pairs
          </dt>
          <dd className="font-mono text-lg">{formatNumber(side.ratedPairs)}</dd>
        </div>
        {side.topIndustry ? (
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Top hiring industry</dt>
            <dd>
              {side.topIndustry.name}{' '}
              <span className="text-muted">({formatNumber(side.topIndustry.count)})</span>
            </dd>
          </div>
        ) : null}
      </dl>
      <ol className="mt-5 space-y-1 text-sm">
        {side.employers.map((e) => (
          <li key={e.name}>
            {e.name}
            <span className="text-muted"> · {e.badge}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm">
        <Link to={`/v4/map/${side.cip.code}`} className="text-ink underline underline-offset-2 hover:text-primary">
          Atlas →
        </Link>
      </p>
    </section>
  )
}

export function V4IndustriesPage() {
  const { cipCode = '' } = useParams()
  const majorName = useMajorName(cipCode)
  const [data, setData] = useState<IndustriesPayload | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStatus('loading')
      try {
        const payload = await fetchIndustries(cipCode)
        if (!cancelled) {
          setData(payload)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed')
          setStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cipCode])

  const max = Math.max(1, ...(data?.industries.map((i) => i.count) || [1]))

  return (
    <V4Frame
      option="H"
      title={majorName || data?.cip.title || cipCode}
      kicker={data ? data.cluster.name : 'industries'}
      subtitle="Which industries actually hire this field — not just the obvious sector."
      loading={status === 'loading'}
      loadingHint="Grouping rated company × occupation pairs by industry…"
      error={status === 'error' ? error : null}
    >
      {data ? (
        <>
          <p className="mt-6 font-mono text-sm tabular-nums">
            <span className="text-ink text-lg">{formatNumber(data.totalPairs)}</span>
            <span className="ml-2 text-muted font-sans text-xs">rated pairs in this cluster</span>
          </p>
          <ul className="mt-8 max-w-3xl space-y-4">
            {data.industries.map((row) => (
              <li key={row.name}>
                <div className="flex justify-between text-sm mb-1.5 gap-3">
                  <span className="text-ink">{row.name}</span>
                  <span className="font-mono tabular-nums text-muted shrink-0">
                    {formatNumber(row.count)} · {Math.round(row.share * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(3, (row.count / max) * 100)}%` }}
                  />
                </div>
                {row.samples.length ? (
                  <p className="mt-1 text-xs text-muted">
                    Platinum examples: {row.samples.join(' · ')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <Coverage text={data.coverage.text} source={data.coverage.source} />
        </>
      ) : null}
    </V4Frame>
  )
}
