import { useEffect, useMemo, useState } from 'react'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { FeatureCollection, Geometry } from 'geojson'
import { assetUrl } from '../../lib/assetUrl'

type Point = {
  id: string
  label: string
  sublabel?: string
  lat: number
  lng: number
  value: number
  href?: string
}

type Props = {
  points: Point[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  valueLabel?: string
  emptyHint?: string
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

export function UsaMetroMap({
  points,
  selectedId,
  onSelect,
  valueLabel = 'employers',
  emptyHint = 'No metros with hiring in this snapshot.',
}: Props) {
  const [topo, setTopo] = useState<FeatureCollection<Geometry> | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(assetUrl('data/us-states-10m.json'))
        const raw = (await res.json()) as Topology<{ states: GeometryCollection }>
        const obj = raw.objects.states ?? Object.values(raw.objects)[0]
        const fc = feature(raw, obj) as unknown as FeatureCollection<Geometry>
        if (!cancelled) setTopo(fc)
      } catch {
        if (!cancelled) setTopo(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const projection = useMemo(() => {
    const p = geoAlbersUsa()
    if (topo) {
      return p.fitExtent(
        [
          [24, 16],
          [936, 544],
        ],
        topo,
      )
    }
    return p.translate([480, 280]).scale(700)
  }, [topo])

  const paths = useMemo(() => {
    if (!topo) return []
    const path = geoPath(projection)
    return topo.features.map((f, i) => {
      const id = String(f.id ?? i).padStart(2, '0')
      return { id, abbr: FIPS_TO_ABBR[id] || id, d: path(f) ?? '' }
    })
  }, [topo, projection])

  const plotted = useMemo(() => {
    const max = Math.max(1, ...points.map((p) => p.value))
    return points
      .map((p) => {
        const xy = projection([p.lng, p.lat])
        if (!xy) return null
        const t = Math.sqrt(p.value / max)
        return {
          ...p,
          x: xy[0],
          y: xy[1],
          r: 5 + t * 22,
        }
      })
      .filter((p): p is NonNullable<typeof p> => p != null)
  }, [points, projection])

  const activeId = hover || selectedId
  const active = plotted.find((p) => p.id === activeId) ?? null

  if (!points.length) {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-16 text-center text-sm text-muted">
        {emptyHint}
      </div>
    )
  }

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      <svg
        viewBox="0 0 960 560"
        className="w-full h-auto"
        role="img"
        aria-label="U.S. metro hiring map"
      >
        {paths.map((p) => (
          <path
            key={p.id}
            d={p.d}
            fill="var(--color-surface)"
            stroke="var(--color-border-bright)"
            strokeWidth={0.8}
          />
        ))}
        {plotted
          .slice()
          .sort((a, b) => b.r - a.r)
          .map((p) => {
            const isActive = p.id === activeId
            return (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill={isActive ? 'var(--color-primary)' : 'var(--color-primary)'}
                fillOpacity={isActive ? 0.9 : 0.45}
                stroke="var(--color-page)"
                strokeWidth={isActive ? 2 : 1}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${p.label}: ${p.value} ${valueLabel}`}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p.id)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect?.(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect?.(p.id)
                  }
                }}
              >
                <title>
                  {p.label}: {p.value} {valueLabel}
                </title>
              </circle>
            )
          })}
      </svg>
      {active ? (
        <div className="pointer-events-none absolute left-3 right-3 bottom-3 sm:left-auto sm:right-4 sm:bottom-4 sm:w-64 rounded-lg border border-border bg-page/95 px-3 py-2.5">
          <p className="font-medium text-ink text-sm leading-snug">{active.label}</p>
          <p className="mt-0.5 font-mono text-xs text-ink tabular-nums">
            {active.value} {valueLabel}
          </p>
          {active.sublabel ? (
            <p className="mt-1 text-xs text-muted leading-relaxed">{active.sublabel}</p>
          ) : null}
        </div>
      ) : (
        <p className="absolute left-3 bottom-3 text-[11px] text-muted max-w-[14rem]">
          Hover a metro. Click to open the report.
        </p>
      )}
    </div>
  )
}
