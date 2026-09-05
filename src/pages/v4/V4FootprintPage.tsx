import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BackLink } from '../../components/BackLink'
import { DocumentMeta } from '../../components/DocumentMeta'
import { formatNumber } from '../../lib/format'
import { useData } from '../../data/DataContext'
import { fetchFootprint } from '../../lib/v4/data'
import type { FootprintPayload } from '../../lib/v4/types'
import { UsaMetroMap } from './UsaMetroMap'

export function V4FootprintPage() {
  const { cipCode = '', companyName = '' } = useParams()
  const navigate = useNavigate()
  const { majors } = useData()
  const company = decodeURIComponent(companyName)
  const [data, setData] = useState<FootprintPayload | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const majorName = majors.find((m) => m.cip === cipCode)?.name

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStatus('loading')
      setData(null)
      setError(null)
      try {
        if (!/^\d{2}\.\d{4}$/.test(cipCode) || !company) {
          setStatus('error')
          setError('Need a CIP code and a company name.')
          return
        }
        const payload = await fetchFootprint(cipCode, company)
        if (!cancelled) {
          setData(payload)
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
  }, [cipCode, company])

  const points = useMemo(() => {
    if (!data) return []
    return data.metros.map((m) => ({
      id: m.cbsa,
      label: m.short,
      sublabel: m.clusters.filter(Boolean).slice(0, 2).join(' · '),
      lat: m.lat,
      lng: m.lng,
      value: Math.max(1, m.intensity),
    }))
  }, [data])

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <p className="text-muted">Mapping where {company} hires this field…</p>
      </div>
    )
  }

  if (status === 'error' || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <BackLink to={`/v4/map/${cipCode}`}>← Back to atlas</BackLink>
        <h1 className="font-sans font-bold tracking-tight text-2xl text-ink">Could not build this footprint</h1>
        <p className="mt-3 text-negative">{error}</p>
      </div>
    )
  }

  const title = majorName || data.cip.title

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
      <DocumentMeta title={`${data.company} — ${title} hiring map`} />
      <BackLink to={`/v4/map/${cipCode}`}>← U.S. hiring atlas</BackLink>

      <header className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          Option C · {data.cip.code} · {data.cluster.name}
        </p>
        <h1 className="mt-2 font-sans font-bold tracking-tight text-3xl sm:text-5xl text-ink leading-tight">
          {data.company}
        </h1>
        <p className="mt-3 text-lg text-ink/70">
          Metros where this employer hires people in {title.toLowerCase()}.
        </p>
      </header>

      <p className="mt-8 font-mono text-sm tabular-nums">
        <span className="text-ink text-lg">{formatNumber(data.totals.metros)}</span>
        <span className="ml-2 text-muted font-sans text-xs sm:text-sm">
          metros in this snapshot
        </span>
      </p>

      <div className="mt-8">
        <UsaMetroMap
          points={points}
          onSelect={(id) => {
            const metro = data.metros.find((m) => m.cbsa === id)
            if (metro?.zip) navigate(`/v4/results/${cipCode}/${metro.zip}`)
          }}
          valueLabel="hiring intensity"
          emptyHint="No overlapping metros in the atlas or hiring_flag snapshot for this employer and field."
        />
      </div>

      <ol className="mt-10 divide-y divide-border border-y border-border max-w-3xl">
        {data.metros.map((m) => (
          <li key={m.cbsa} className="py-3 flex items-center justify-between gap-3">
            {m.zip ? (
              <Link
                to={`/v4/results/${cipCode}/${m.zip}`}
                className="text-ink/90 hover:text-ink min-h-11 inline-flex items-center"
              >
                {m.short}
              </Link>
            ) : (
              <span className="text-ink/80">{m.short}</span>
            )}
            <span className="font-mono text-xs text-muted">
              {m.fromAtlas && m.fromHiring
                ? 'rated here · hiring flag'
                : m.fromAtlas
                  ? 'rated here'
                  : 'hiring flag'}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-8 max-w-2xl text-sm text-ink/70 leading-relaxed border-l border-border pl-4">
        {data.coverage.text}
      </p>
      <p className="mt-3 max-w-2xl text-xs text-muted leading-relaxed">
        {data.coverage.source}
      </p>
      <p className="mt-8 text-sm">
        <Link to="/v4" className="text-muted hover:text-ink">
          ← All v4 prototypes
        </Link>
      </p>
    </div>
  )
}
