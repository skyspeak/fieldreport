import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackLink } from '../../components/BackLink'
import { DocumentMeta } from '../../components/DocumentMeta'
import { formatNumber, formatSalary } from '../../lib/format'
import { useData } from '../../data/DataContext'
import { fetchV4Report, type V4FieldReport } from '../../lib/v4/data'
import { EmployerTable } from '../v3/EmployerTable'

export function V4ResultsPage() {
  const { cipCode = '', zip = '' } = useParams()
  const { majors } = useData()
  const [report, setReport] = useState<V4FieldReport | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const majorName = majors.find((m) => m.cip === cipCode)?.name

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStatus('loading')
      setReport(null)
      setError(null)
      try {
        if (!/^\d{2}\.\d{4}$/.test(cipCode) || !/^\d{5}$/.test(zip)) {
          setStatus('error')
          setError('Use a CIP code and a 5-digit U.S. ZIP.')
          return
        }
        const data = await fetchV4Report(cipCode, zip)
        if (!cancelled) {
          setReport(data)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load')
          setStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cipCode, zip])

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <p className="text-muted">Building the enriched metro report…</p>
        <p className="mt-2 text-sm text-muted">
          Employers, AOI wages, skills, and the national ranking.
        </p>
      </div>
    )
  }

  if (status === 'error' || !report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <BackLink to={`/v4/map/${cipCode}`}>← Back to atlas</BackLink>
        <h1 className="font-sans font-bold tracking-tight text-2xl text-ink">Could not build this report</h1>
        <p className="mt-3 text-negative">{error}</p>
      </div>
    )
  }

  const metroShort = report.place.cbsaName.split('-')[0].split(',')[0].trim()

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
      <DocumentMeta
        title={`${majorName || report.cip.title} in ${report.place.cbsaName}`}
      />
      <BackLink to={`/v4/map/${cipCode}`}>← U.S. hiring atlas</BackLink>

      <header className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          Option B · {report.cip.code} · {report.place.zip}
        </p>
        <h1 className="mt-2 font-sans font-bold tracking-tight text-3xl sm:text-5xl text-ink leading-tight">
          {majorName || report.cip.title}
        </h1>
        <p className="mt-3 text-lg text-ink/70">
          Rated employers in {metroShort}, plus AOI pay and skills the v3 page
          does not show.
        </p>
      </header>

      <section className="mt-10 max-w-3xl">
        <h2 className="font-sans font-bold tracking-tight text-2xl text-ink">The funnel</h2>
        <Funnel funnel={report.funnel} />
      </section>

      <WageLadder groups={report.wagesByGroup || []} msaSize={report.place.msaSize} />
      <SkillsBlock groups={report.skillsByGroup || []} />

      <EmployerTable
        report={report}
        resultsBase="/v4/results"
        named
        companyTo={(e) =>
          `/v4/company/${report.cip.code}/${encodeURIComponent(e.companyName)}`
        }
        hideMetros
      />

      <FiveYearsOut report={report} />
      <DoorSection report={report} />

      <AtlasRank report={report} cip={cipCode} />

      <p className="mt-10 text-sm">
        <Link to="/v4" className="text-muted hover:text-ink">
          ← All v4 prototypes
        </Link>
        <span className="text-muted"> · </span>
        <Link to="/receipts" className="text-ink underline underline-offset-2 hover:text-primary">
          How to read ratings
        </Link>
      </p>
    </div>
  )
}

function Funnel({ funnel }: { funnel: V4FieldReport['funnel'] }) {
  const max = Math.max(funnel.ratedInField, funnel.hiringHere, 1)
  const bars = [
    { label: 'Rated in your field', value: funnel.ratedInField, accent: false },
    { label: 'Hiring in your metro', value: funnel.hiringHere, accent: true },
  ]
  return (
    <ul className="mt-6 space-y-4">
      {bars.map((b) => (
        <li key={b.label}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted">{b.label}</span>
            <span
              className={`font-mono tabular-nums ${
                b.accent ? 'text-primary font-medium' : 'text-ink'
              }`}
            >
              {formatNumber(b.value)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface overflow-hidden">
            <div
              className={`h-full rounded-full ${b.accent ? 'bg-primary' : 'bg-ink/25'}`}
              style={{ width: `${Math.max(4, (b.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function WageLadder({
  groups,
  msaSize,
}: {
  groups: NonNullable<V4FieldReport['wagesByGroup']>
  msaSize: string
}) {
  if (!groups.some((g) => g.entry || g.year5 || g.year10)) return null
  return (
    <section className="mt-12 max-w-3xl">
      <h2 className="font-sans font-bold tracking-tight text-2xl text-ink">AOI wage ladder</h2>
      <p className="mt-2 text-sm text-muted leading-relaxed">
        Occupation-level pay by experience (0 / 5 / 10 years) for {msaSize}{' '}
        metros. Not company-specific — there is still no per-employer wage in
        WYWM.
      </p>
      <ul className="mt-6 space-y-5">
        {groups.map((g) => (
          <li key={g.groupId} className="border-t border-border pt-4">
            <h3 className="font-sans font-bold tracking-tight text-lg text-ink">{g.groupName}</h3>
            <div className="mt-3 grid grid-cols-3 gap-3 font-mono text-sm tabular-nums">
              <WageCell label="Entry" band={g.entry} />
              <WageCell label="Year 5" band={g.year5} />
              <WageCell label="Year 10" band={g.year10} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function WageCell({
  label,
  band,
}: {
  label: string
  band: { median: number } | null
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted font-sans">
        {label}
      </p>
      <p className="mt-1 text-ink">{band ? formatSalary(band.median) : '—'}</p>
    </div>
  )
}

function SkillsBlock({
  groups,
}: {
  groups: NonNullable<V4FieldReport['skillsByGroup']>
}) {
  if (!groups.length) return null
  return (
    <section className="mt-12 max-w-3xl">
      <h2 className="font-sans font-bold tracking-tight text-2xl text-ink">What the cluster actually is</h2>
      <ul className="mt-5 space-y-5">
        {groups.map((g) => (
          <li key={g.groupId} className="border-t border-border pt-4">
            <h3 className="font-sans font-bold tracking-tight text-lg text-ink">{g.groupName}</h3>
            <p className="mt-1 text-sm text-muted">
              {[g.jobLevel, g.aiFlag].filter(Boolean).join(' · ')}
              {g.baPlusShare != null
                ? ` · ${Math.round(g.baPlusShare * 100)}% BA+`
                : ''}
            </p>
            {g.jobTitles.length ? (
              <p className="mt-2 text-sm text-ink/80">
                Common titles: {g.jobTitles.join(' · ')}
              </p>
            ) : null}
            {g.premiumSkills.length ? (
              <p className="mt-1 text-sm text-muted">
                Premium skills: {g.premiumSkills.join(' · ')}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function FiveYearsOut({ report }: { report: V4FieldReport }) {
  return (
    <section className="mt-14 max-w-3xl">
      <h2 className="font-sans font-bold tracking-tight text-2xl sm:text-3xl text-ink">Five years out</h2>
      <ul className="mt-6 space-y-6">
        {report.groups.map((g) => (
          <li key={g.id} className="border-t border-border pt-5">
            <h3 className="font-sans font-bold tracking-tight text-xl text-ink">{g.displayName}</h3>
            {g.promotion ? (
              <p className="mt-3 text-ink/90 leading-relaxed">
                {g.promotion.internalPct}% move up without changing employer.{' '}
                {g.promotion.externalPct}% have to leave to move up.{' '}
                <span className="text-muted">{g.promotion.verdict}</span>
              </p>
            ) : null}
            {g.destinations?.length ? (
              <p className="mt-2 text-sm text-muted">
                Common next roles: {g.destinations.map((d) => d.name).join(' · ')}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function DoorSection({ report }: { report: V4FieldReport }) {
  return (
    <section className="mt-14 max-w-3xl">
      <h2 className="font-sans font-bold tracking-tight text-2xl sm:text-3xl text-ink">The Door</h2>
      <ul className="mt-6 space-y-5">
        {report.door.map((d) => (
          <li
            key={d.groupId}
            className="rounded-xl border border-border bg-card px-5 py-4"
          >
            <p className="text-xs font-mono uppercase tracking-wider text-muted">
              {d.groupName}
            </p>
            <h3 className="mt-1 font-sans font-bold tracking-tight text-xl text-ink">
              {d.heading || 'Mixed picture'}
            </h3>
            <p className="mt-2 text-ink/80 leading-relaxed">
              {d.body || 'Trends vary across roles in this group.'}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AtlasRank({ report, cip }: { report: V4FieldReport; cip: string }) {
  const metros = (report.metros || []).filter((m) => m.employersHiring > 0)
  if (!metros.length) return null
  return (
    <section className="mt-14 max-w-3xl">
      <h2 className="font-sans font-bold tracking-tight text-2xl text-ink">How this metro ranks</h2>
      <p className="mt-2 text-sm text-muted">
        Rated early-career employers in this field, from the national atlas.
      </p>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {metros.slice(0, 12).map((m) => (
          <li key={m.cbsa}>
            <Link
              to={`/v4/results/${cip}/${m.zip}`}
              className={`flex items-center justify-between gap-3 py-3 text-sm min-h-11 no-underline ${
                m.isCurrent ? 'text-ink font-medium' : 'text-ink/80 hover:text-ink'
              }`}
            >
              <span>
                {'short' in m && m.short ? String(m.short) : m.cbsaName}
                {m.isCurrent ? ' · you' : ''}
              </span>
              <span className="font-mono text-muted tabular-nums">
                {m.employersHiring}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        <Link to={`/v4/map/${cip}`} className="text-ink underline underline-offset-2 hover:text-primary">
          Full U.S. map →
        </Link>
      </p>
    </section>
  )
}
