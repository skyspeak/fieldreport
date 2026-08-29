import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Employer, FieldReport } from '../../lib/v3/types'
import { NAMED_EMPLOYERS } from '../../lib/v3/data'
import { useAppPaths } from '../../lib/useAppPaths'

const HIRING_LABEL: Record<number, string> = {
  2: 'High hiring',
  1: 'Active hiring',
}

const SHORTLIST = 9

type Props = {
  report: FieldReport
  resultsBase: string
}

export function EmployerTable({ report, resultsBase }: Props) {
  const { receipts } = useAppPaths()
  const [coreOnly, setCoreOnly] = useState(false)
  const [platinumOnly, setPlatinumOnly] = useState(false)
  const [groupFilter, setGroupFilter] = useState<number | null>(null)
  const [showRoster, setShowRoster] = useState(false)

  const groupLabel = useMemo(() => {
    const m = new Map(report.groups.map((g) => [g.id, g.displayName]))
    return (ids: number[]) =>
      ids.map((id) => m.get(id) || `Group ${id}`).join(' · ')
  }, [report.groups])

  const filtered = useMemo(() => {
    return report.employers.filter((e) => {
      if (coreOnly && !e.top10) return false
      if (platinumOnly && e.badgeEarlyCareer !== 'Platinum') return false
      if (groupFilter != null && !e.groupIds.includes(groupFilter)) return false
      return true
    })
  }, [report.employers, coreOnly, platinumOnly, groupFilter])

  const shortlist = filtered.slice(0, SHORTLIST)
  const remainder = filtered.slice(SHORTLIST)

  const byIndustry = useMemo(() => {
    const map = new Map<string, Employer[]>()
    for (const e of filtered) {
      const key = e.primaryIndustry || 'Other'
      const list = map.get(key) || []
      list.push(e)
      map.set(key, list)
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  const stats = useMemo(() => {
    const platinum = filtered.filter((e) => e.badgeEarlyCareer === 'Platinum').length
    const core = filtered.filter((e) => e.top10).length
    return { platinum, core, total: filtered.length }
  }, [filtered])

  const thin = report.employers.length > 0 && report.employers.length < 6
  const metroShort = report.place.cbsaName.split(',')[0]

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(window.location.search)
    if (value == null) params.delete(key)
    else params.set(key, value)
    const qs = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${qs ? `?${qs}` : ''}`,
    )
  }

  if (report.employers.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="font-serif text-2xl sm:text-3xl text-ink">
          Where this degree is hiring
        </h2>
        <p className="mt-3 text-muted max-w-2xl leading-relaxed">
          We do not have rated early-career employers for your field in this
          metro yet. Compare other metros below.
        </p>
        <MetroList report={report} resultsBase={resultsBase} />
      </section>
    )
  }

  return (
    <section id="employers" className="mt-10 scroll-mt-24">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-primary">
          Nine Names
        </p>
        <h2 className="mt-2 font-serif text-2xl sm:text-4xl text-ink leading-tight">
          Who is still hiring early career in {metroShort}
        </h2>
        <p className="mt-3 text-muted leading-relaxed">
          Rated employers opening roles tied to your degree — ranked by hiring
          intensity, then early-career rating, then whether this is a core role
          for them.
        </p>
      </div>

      {/* Signal strip */}
      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-mono text-sm tabular-nums">
        <Stat n={stats.total} label="rated here" />
        <Stat n={stats.platinum} label="Platinum entry" />
        <Stat n={stats.core} label="core roles" />
      </div>

      {/* Field lens — text, not pill soup */}
      <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-sm border-b border-border pb-3">
        <span className="text-xs uppercase tracking-wider text-muted shrink-0">
          Show
        </span>
        <FilterLink
          active={groupFilter == null && !coreOnly && !platinumOnly}
          onClick={() => {
            setGroupFilter(null)
            setCoreOnly(false)
            setPlatinumOnly(false)
            setParam('group', null)
            setParam('core', null)
            setParam('platinum', null)
          }}
        >
          Everyone
        </FilterLink>
        <FilterLink
          active={platinumOnly}
          onClick={() => {
            const next = !platinumOnly
            setPlatinumOnly(next)
            setParam('platinum', next ? '1' : null)
          }}
        >
          Platinum
        </FilterLink>
        <FilterLink
          active={coreOnly}
          onClick={() => {
            const next = !coreOnly
            setCoreOnly(next)
            setParam('core', next ? '1' : null)
          }}
        >
          Core roles
        </FilterLink>
        {report.groups.map((g) => (
          <FilterLink
            key={g.id}
            active={groupFilter === g.id}
            onClick={() => {
              const next = groupFilter === g.id ? null : g.id
              setGroupFilter(next)
              setParam('group', next != null ? String(next) : null)
            }}
          >
            {g.displayName}
          </FilterLink>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-muted">No employers match these filters.</p>
      ) : (
        <>
          {/* Editorial shortlist */}
          <ol className="mt-10 max-w-3xl">
            {shortlist.map((e, i) => (
              <li
                key={e.companyUid}
                className="group grid grid-cols-[2.5rem_1fr] sm:grid-cols-[3rem_1fr] gap-3 sm:gap-5 py-5 border-b border-border/80 first:border-t first:border-border"
                style={{
                  animation: 'frFadeUp 420ms ease both',
                  animationDelay: `${Math.min(i, 8) * 40}ms`,
                }}
              >
                <span className="font-mono text-sm text-muted/70 pt-1 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="font-serif text-xl sm:text-2xl text-ink leading-snug tracking-tight">
                    {displayName(e, i)}
                  </div>
                  <p className="mt-1.5 text-sm text-muted leading-relaxed">
                    <MetaBits e={e} field={groupLabel(e.groupIds)} />
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-4 max-w-3xl text-sm text-muted">
            <Link
              to={receipts}
              className="text-primary hover:text-primary-bright"
            >
              What Platinum and core roles mean
            </Link>
          </p>

          {remainder.length > 0 && !showRoster ? (
            <button
              type="button"
              onClick={() => setShowRoster(true)}
              className="mt-6 text-sm text-primary hover:text-primary-bright min-h-11"
            >
              Full roster — {filtered.length} employers
            </button>
          ) : null}

          {showRoster || filtered.length <= SHORTLIST ? (
            <div className="mt-10 max-w-3xl">
              {remainder.length > 0 ? (
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted mb-4">
                  Full roster by industry
                </h3>
              ) : null}
              <div className="space-y-8">
                {byIndustry.map(([industry, list]) => (
                  <div key={industry}>
                    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
                      <h4 className="font-serif text-lg text-ink">{industry}</h4>
                      <span className="font-mono text-xs text-muted tabular-nums">
                        {list.length}
                      </span>
                    </div>
                    <ul className="mt-3 columns-1 sm:columns-2 gap-x-10">
                      {list.map((e) => (
                        <li
                          key={e.companyUid}
                          className="break-inside-avoid py-1.5 text-sm text-ink/85 flex items-baseline gap-2"
                        >
                          <span className="min-w-0 truncate">
                            {NAMED_EMPLOYERS
                              ? e.companyName
                              : redactName(e)}
                          </span>
                          {e.badgeEarlyCareer === 'Platinum' ? (
                            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-primary">
                              Pt
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {remainder.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowRoster(false)}
                  className="mt-6 text-sm text-muted hover:text-ink min-h-11"
                >
                  Show shortlist only
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {thin ? (
        <p className="mt-6 text-sm text-muted leading-relaxed max-w-2xl">
          Few rated employers in this metro. Try another ZIP if you can move —
          or widen filters above.
        </p>
      ) : null}

      <p className="mt-8 text-sm text-ink/70 leading-relaxed border-l-2 border-primary/40 pl-4 max-w-2xl">
        {report.coverage.text}
      </p>

      <MetroList report={report} resultsBase={resultsBase} />

      <style>{`
        @keyframes frFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          li[style*="frFadeUp"] { animation: none !important; }
        }
      `}</style>
    </section>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <span className="text-ink text-lg sm:text-xl">{n}</span>
      <span className="ml-2 text-muted normal-case tracking-normal text-xs sm:text-sm font-sans">
        {label}
      </span>
    </div>
  )
}

function MetaBits({ e, field }: { e: Employer; field: string }) {
  const bits = [
    e.primaryIndustry,
    e.badgeEarlyCareer ? `${e.badgeEarlyCareer} entry` : null,
    HIRING_LABEL[e.hiringIntensity] || null,
    e.top10 ? 'Core role' : null,
    field || null,
  ].filter(Boolean)
  return <>{bits.join(' · ')}</>
}

function displayName(e: Employer, index: number) {
  if (NAMED_EMPLOYERS) return e.companyName
  const industry = e.primaryIndustry || 'Employer'
  return `${industry} employer ${String.fromCharCode(65 + (index % 26))}`
}

function redactName(e: Employer) {
  return e.primaryIndustry ? `${e.primaryIndustry} employer` : 'Rated employer'
}

function FilterLink({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 transition-colors ${
        active
          ? 'text-ink font-medium underline decoration-primary decoration-2 underline-offset-4'
          : 'text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function MetroList({
  report,
  resultsBase,
}: {
  report: FieldReport
  resultsBase: string
}) {
  const metros = (report.metros || []).filter((m) => m.employersHiring > 0)
  if (!metros.length) return null
  return (
    <div className="mt-12 max-w-3xl">
      <h3 className="font-serif text-xl text-ink">Other metros</h3>
      <p className="mt-1 text-sm text-muted">
        Where else this degree has rated early-career hiring.
      </p>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {metros.map((m) => (
          <li key={m.cbsa}>
            <Link
              to={`${resultsBase}/${report.cip.code}/${m.zip}`}
              className={`flex items-center justify-between gap-3 py-3 text-sm min-h-11 no-underline ${
                m.isCurrent ? 'text-ink font-medium' : 'text-ink/80 hover:text-ink'
              }`}
            >
              <span>
                {m.cbsaName}
                {m.isCurrent ? ' · you' : ''}
              </span>
              <span className="font-mono text-muted tabular-nums">
                {m.employersHiring}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
