import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BackLink } from '../../components/BackLink'
import { DocumentMeta } from '../../components/DocumentMeta'
import { formatNumber } from '../../lib/format'
import { useData } from '../../data/DataContext'
import { fetchAtlas } from '../../lib/v4/data'
import type { AtlasPayload } from '../../lib/v4/types'
import { UsaMetroMap } from './UsaMetroMap'

export function V4AtlasPage() {
  const { cipCode = '' } = useParams()
  const navigate = useNavigate()
  const { majors } = useData()
  const [atlas, setAtlas] = useState<AtlasPayload | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const majorName = majors.find((m) => m.cip === cipCode)?.name

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setStatus('loading')
      setAtlas(null)
      setError(null)
      try {
        if (!/^\d{2}\.\d{4}$/.test(cipCode)) {
          setStatus('error')
          setError('Use a CIP code such as 11.0701.')
          return
        }
        const data = await fetchAtlas(cipCode)
        if (!cancelled) {
          setAtlas(data)
          setStatus('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load atlas')
          setStatus('error')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cipCode])

  const points = useMemo(() => {
    if (!atlas) return []
    return atlas.metros.map((m) => ({
      id: m.cbsa,
      label: m.short,
      sublabel: m.samples?.length
        ? `Platinum: ${m.samples.slice(0, 3).join(', ')}`
        : `${m.platinum} Platinum`,
      lat: m.lat,
      lng: m.lng,
      value: m.employers,
    }))
  }, [atlas])

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <p className="text-muted">Building a U.S. hiring atlas from AOI…</p>
        <p className="mt-2 text-sm text-muted">
          Counting rated employers in 40 metros. First load can take a minute;
          later visits are cached.
        </p>
      </div>
    )
  }

  if (status === 'error' || !atlas) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <BackLink to="/v4">← v4 prototypes</BackLink>
        <h1 className="font-sans font-bold tracking-tight text-2xl text-ink">Could not build this atlas</h1>
        <p className="mt-3 text-negative">{error}</p>
      </div>
    )
  }

  const title = majorName || atlas.cip.title
  const selectedMetro = atlas.metros.find((m) => m.cbsa === selected)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
      <DocumentMeta title={`${title} — U.S. hiring atlas`} />
      <BackLink to="/v4">← v4 prototypes</BackLink>
      <header className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          Option A · {atlas.cip.code} · cluster {atlas.cluster.id}
        </p>
        <h1 className="mt-2 font-sans font-bold tracking-tight text-3xl sm:text-5xl text-ink leading-tight">
          {title}
        </h1>
        <p className="mt-3 text-lg text-ink/70">
          Where rated employers hire {atlas.cluster.name.toLowerCase()} across
          the country.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-mono text-sm tabular-nums">
        <div>
          <span className="text-ink text-lg sm:text-xl">
            {formatNumber(atlas.totals.metrosWithHiring)}
          </span>
          <span className="ml-2 text-muted font-sans text-xs sm:text-sm">
            metros with hiring
          </span>
        </div>
        <div>
          <span className="text-ink text-lg sm:text-xl">
            {formatNumber(atlas.totals.employersPeak)}
          </span>
          <span className="ml-2 text-muted font-sans text-xs sm:text-sm">
            peak metro (rated employers)
          </span>
        </div>
      </div>

      <div className="mt-8">
        <UsaMetroMap
          points={points}
          selectedId={selected}
          onSelect={(id) => {
            setSelected(id)
            const metro = atlas.metros.find((m) => m.cbsa === id)
            if (metro?.zip) navigate(`/v4/results/${cipCode}/${metro.zip}`)
          }}
          valueLabel="rated employers"
        />
      </div>

      {selectedMetro ? (
        <p className="mt-3 text-sm text-muted">
          Opening {selectedMetro.short}…
        </p>
      ) : null}

      <ol className="mt-10 divide-y divide-border border-y border-border max-w-3xl">
        {atlas.metros.map((m, i) => (
          <li key={m.cbsa}>
            <Link
              to={`/v4/results/${cipCode}/${m.zip}`}
              className="flex items-center justify-between gap-3 py-3 min-h-11 no-underline text-ink/90 hover:text-ink"
            >
              <span className="min-w-0">
                <span className="font-mono text-xs text-muted mr-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {m.short}
                <span className="hidden sm:inline text-muted">
                  {' '}
                  · {m.platinum} Platinum
                </span>
              </span>
              <span className="font-mono text-sm tabular-nums text-ink">
                {m.employers}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-8 max-w-2xl text-sm text-ink/70 leading-relaxed border-l border-border pl-4">
        {atlas.coverage.text}
      </p>
      <p className="mt-3 max-w-2xl text-xs text-muted leading-relaxed">
        {atlas.coverage.source}
      </p>
    </div>
  )
}
