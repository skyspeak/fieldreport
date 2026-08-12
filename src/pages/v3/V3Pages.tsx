import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BackLink } from '../../components/BackLink'
import { BrandMark } from '../../components/BrandMark'
import { DocumentMeta } from '../../components/DocumentMeta'
import { MajorSearch } from '../../components/MajorSearch'
import { useData } from '../../data/DataContext'
import { formatNumber } from '../../lib/format'
import { useAppPaths } from '../../lib/useAppPaths'
import { fetchLiveFieldReport, loadPlaces } from '../../lib/v3/data'
import type { FieldReport } from '../../lib/v3/types'
import { EmployerTable } from './EmployerTable'

export function V3HomePage() {
  const { majors, loading, error } = useData()
  const { resultsBase } = useAppPaths()

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-24 pb-16 sm:pb-20">
      <DocumentMeta title="Field Report v3 — Employers" />
      <div className="text-center max-w-3xl mx-auto">
        <BrandMark size="lg" as="h1" />
        <p className="mt-5 sm:mt-6 text-lg sm:text-2xl text-ink/70 font-light leading-snug px-1">
          Who hires your major — where you live
        </p>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
          Rated early-career employers, five-year pathways, and whether AI is
          closing the door — powered by AOI / WYWM data.
        </p>
        <p className="mt-3 text-xs font-mono uppercase tracking-wider text-primary">
          v3 employer layer
        </p>
      </div>

      <div className="mt-8 sm:mt-12 flex justify-center">
        {loading ? (
          <p className="text-muted">Loading data…</p>
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

      <p className="mt-10 text-center text-sm text-muted max-w-lg mx-auto leading-relaxed">
        Pick any U.S. major, then a ZIP. Employer ratings and pathways load live
        from AOI / WYWM for that field and metro.
      </p>
    </div>
  )
}

export function V3ZipPromptPage() {
  const { cipCode = '' } = useParams()
  const navigate = useNavigate()
  const { resultsBase, home } = useAppPaths()
  const { majors } = useData()
  const [zip, setZip] = useState('94402')
  const [places, setPlaces] = useState<{ zip: string; cbsaName: string }[]>([])

  const major = majors.find((m) => m.cip === cipCode)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const p = await loadPlaces()
      if (cancelled) return
      setPlaces(p.map((x) => ({ zip: x.zip, cbsaName: x.cbsaName })))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const cleaned = zip.replace(/\D/g, '').slice(0, 5)
    if (!/^\d{5}$/.test(cleaned)) return
    navigate(`${resultsBase}/${cipCode}/${cleaned}`)
  }

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 pt-8 sm:pt-16 pb-20">
      <DocumentMeta
        title={
          major
            ? `${major.name} — pick a metro`
            : 'Pick a metro — Field Report v3'
        }
      />
      <BackLink to={home}>← Field Report v3</BackLink>
      <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
        {major?.name || cipCode}
      </h1>
      <p className="mt-3 text-muted leading-relaxed">
        Enter a ZIP so we can show employers hiring people with your degree in
        that metro. Any U.S. ZIP works — major metros resolve to CBSA hiring;
        others fall back to nationwide rated employers.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
        <label className="sr-only" htmlFor="zip">
          ZIP code
        </label>
        <input
          id="zip"
          inputMode="numeric"
          pattern="\d{5}"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          className="flex-1 min-h-12 rounded-xl border border-border bg-white px-4 font-mono tracking-wider"
          placeholder="94402"
        />
        <button
          type="submit"
          className="min-h-12 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary-bright"
        >
          See employers
        </button>
      </form>

      <div className="mt-8">
        <p className="text-xs uppercase tracking-wider text-muted">
          Seed metros
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {places.map((p) => (
            <li key={p.zip}>
              <button
                type="button"
                onClick={() => navigate(`${resultsBase}/${cipCode}/${p.zip}`)}
                className="text-sm min-h-11 px-3 rounded-full border border-border bg-white text-muted hover:text-ink"
              >
                {p.zip}
                <span className="hidden sm:inline"> · {p.cbsaName.split(',')[0]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function V3ResultsPage() {
  const { cipCode = '', zip = '' } = useParams()
  const { resultsBase, home, receipts } = useAppPaths()
  const { majors } = useData()
  const [report, setReport] = useState<FieldReport | null>(null)
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
          setError('Invalid major or ZIP')
          return
        }
        const data = await fetchLiveFieldReport(cipCode, zip)
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
        <p className="text-muted">Building your employer report from AOI…</p>
        <p className="mt-2 text-sm text-muted">
          Resolving occupations, metro hiring, pathways, and AI door flags.
        </p>
      </div>
    )
  }

  if (status === 'error' || !report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <BackLink to={`${resultsBase}/${cipCode}`}>← Change ZIP</BackLink>
        <h1 className="font-serif text-2xl text-ink">Could not build this report</h1>
        <p className="mt-3 text-red-500">{error || 'Unknown error'}</p>
        <p className="mt-4 text-sm text-muted leading-relaxed">
          Check that AOI_USERNAME / AOI_PASSWORD are set for the Vite server, then
          retry. Demo that always has data:{' '}
          <Link to={`${resultsBase}/11.0701/94402`} className="text-primary">
            Computer Science · 94402
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 sm:pt-12 pb-28">
      <DocumentMeta
        title={`${majorName || report.cip.title} in ${report.place.cbsaName}`}
      />
      <BackLink to={`${resultsBase}/${cipCode}`}>← Change ZIP</BackLink>

      <header className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          {report.cip.code} · {report.place.zip}
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-5xl text-ink leading-tight">
          {majorName || report.cip.title}
        </h1>
        <p className="mt-3 text-lg text-ink/70">
          Employers hiring people with your degree in {report.place.cbsaName}
        </p>
      </header>

      <Funnel funnel={report.funnel} />

      <EmployerTable report={report} resultsBase={resultsBase} />

      <FiveYearsOut report={report} />

      <DoorSection report={report} />

      <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Link
          to={receipts}
          className="min-h-11 inline-flex items-center text-primary hover:text-primary-bright"
        >
          How to read this report — Platinum, core roles, and more
        </Link>
        <Link to={home} className="min-h-11 inline-flex items-center text-muted hover:text-ink">
          v3 home
        </Link>
        {report.source?.builtAt ? (
          <span className="font-mono text-xs text-muted">
            Built {new Date(report.source.builtAt).toLocaleString()}
          </span>
        ) : null}
      </div>

      <FeedbackDock cip={report.cip.code} zip={report.place.zip} />
    </div>
  )
}

function Funnel({
  funnel,
}: {
  funnel: FieldReport['funnel']
}) {
  const max = Math.max(funnel.ratedInField, funnel.hiringHere, 1)
  const bars = [
    { label: 'Rated in your field', value: funnel.ratedInField, accent: false },
    { label: 'Hiring in your metro', value: funnel.hiringHere, accent: true },
  ]
  return (
    <section className="mt-10 max-w-3xl">
      <h2 className="font-serif text-2xl text-ink">The funnel</h2>
      <p className="mt-1 text-sm text-muted">
        Share this: how rated employers in your field narrow to those hiring near
        you.
      </p>
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
                className={`h-full rounded-full motion-safe:transition-all ${
                  b.accent ? 'bg-primary' : 'bg-ink/25'
                }`}
                style={{ width: `${Math.max(4, (b.value / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function FiveYearsOut({ report }: { report: FieldReport }) {
  return (
    <section className="mt-14 max-w-3xl">
      <h2 className="font-serif text-2xl sm:text-3xl text-ink">Five years out</h2>
      <p className="mt-2 text-muted leading-relaxed">
        Where people in these fields move next — and whether they stay or leave
        to move up.
      </p>
      <ul className="mt-6 space-y-6">
        {report.groups.map((g) => (
          <li key={g.id} className="border-t border-border pt-5">
            <h3 className="font-serif text-xl text-ink">{g.displayName}</h3>
            <p className="text-sm text-muted mt-1">{g.displayBlurb}</p>
            {g.promotion ? (
              <p className="mt-3 text-ink/90 leading-relaxed">
                <strong className="font-medium">{g.displayName}.</strong>{' '}
                {g.promotion.internalPct}% move up without changing employer.{' '}
                {g.promotion.externalPct}% have to leave to move up.{' '}
                <span className="text-muted">{g.promotion.verdict}</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Promotion split not available for this group at this metro size.
              </p>
            )}
            {g.destinations?.length ? (
              <p className="mt-2 text-sm text-muted">
                Common next roles:{' '}
                {g.destinations.map((d) => d.name).join(' · ')}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function DoorSection({ report }: { report: FieldReport }) {
  return (
    <section className="mt-14 max-w-3xl">
      <h2 className="font-serif text-2xl sm:text-3xl text-ink">The Door</h2>
      <p className="mt-2 text-muted leading-relaxed">
        Whether AI is changing entry — without calling anything risk or safe.
      </p>
      <ul className="mt-6 space-y-5">
        {report.door.map((d) => (
          <li key={d.groupId} className="rounded-xl border border-border bg-white/70 px-5 py-4">
            <p className="text-xs font-mono uppercase tracking-wider text-muted">
              {d.groupName}
            </p>
            <h3 className="mt-1 font-serif text-xl text-ink">
              {d.heading || 'Mixed picture'}
            </h3>
            <p className="mt-2 text-ink/80 leading-relaxed">
              {d.body || 'Trends vary across roles in this group.'}
            </p>
            <a
              href="#employers"
              className="inline-flex mt-3 text-sm text-primary min-h-11 items-center"
            >
              See who is still hiring →
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

const FEEDBACK = [
  'Nine is too few',
  'Show pay per company',
  'Let me compare cities',
  "I don't trust the ratings",
] as const

function FeedbackDock({ cip, zip }: { cip: string; zip: string }) {
  const [sent, setSent] = useState<string | null>(null)

  async function send(choice: string) {
    setSent(choice)
    const payload = { cip, zip, choice, at: new Date().toISOString() }
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      try {
        const prev = JSON.parse(localStorage.getItem('fr-v3-feedback') || '[]')
        prev.push(payload)
        localStorage.setItem('fr-v3-feedback', JSON.stringify(prev.slice(-50)))
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-white/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2 flex flex-wrap gap-2 items-center justify-center sm:justify-between">
        <p className="text-xs text-muted hidden sm:block">Quick feedback</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {FEEDBACK.map((c) => (
            <button
              key={c}
              type="button"
              disabled={sent != null}
              onClick={() => send(c)}
              className={`text-xs sm:text-sm min-h-10 px-3 rounded-full border ${
                sent === c
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted hover:text-ink'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
