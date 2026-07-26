import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../data/DataContext'
import { DigestSignup } from '../components/DigestSignup'
import { DocumentMeta } from '../components/DocumentMeta'
import { InfoTip } from '../components/InfoTip'
import { ShareSheet } from '../components/ShareSheet'
import { formatNumber, formatRatio, formatSalary, formatShare } from '../lib/format'
import {
  AI_BAND_COPY,
  COMPETITION_COPY,
  ELOUNDOU_ALPHA_COPY,
  ELOUNDOU_BAND_COLORS,
  ELOUNDOU_COPY,
  ELOUNDOU_GAMMA_COPY,
  aiBandFromScore,
} from '../lib/labels'
import { isRealMajor, majorDisplayName } from '../lib/majorName'
import type {
  CompetitionLevel,
  EloundouScore,
  Occupation,
  SortDirection,
  SortField,
} from '../types'

function isCatchAllOccupation(occ: Occupation): boolean {
  return /,\s*All Other$/i.test(occ.title)
}

export function ResultsPage({ routePrefix = '' }: { routePrefix?: '' | '/v2' }) {
  const { cipCode = '' } = useParams()
  const { majors, occupationsBySoc, crosswalk, eloundouBySoc, loading } = useData()
  const home = routePrefix || '/'
  const mapBase = `${routePrefix}/map`

  const [sortField, setSortField] = useState<SortField>('entrySalary')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const major = useMemo(() => {
    if (!isRealMajor(cipCode)) return undefined
    return majors.find((m) => m.cip === cipCode)
  }, [majors, cipCode])

  const { relevant, other } = useMemo(() => {
    const entry = major ? crosswalk[cipCode] : undefined
    if (!entry) return { relevant: [] as Occupation[], other: [] as Occupation[] }

    const primarySet = new Set(entry.primary)
    const allSocs = [...entry.primary, ...entry.related]
    const seen = new Set<string>()
    const list: Occupation[] = []

    for (const soc of allSocs) {
      if (seen.has(soc)) continue
      seen.add(soc)
      const occ = occupationsBySoc.get(soc)
      if (occ) list.push(occ)
    }

    const sorted = [...list].sort((a, b) =>
      compareOcc(a, b, sortField, sortDirection, eloundouBySoc),
    )
    return {
      relevant: sorted.filter((o) => primarySet.has(o.soc)),
      other: sorted.filter((o) => !primarySet.has(o.soc)),
    }
  }, [major, cipCode, crosswalk, occupationsBySoc, sortField, sortDirection, eloundouBySoc])

  function onSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(
        field === 'graduatesPerOpening' ||
          field === 'karpathyExposure' ||
          field === 'eloundouBeta'
          ? 'asc'
          : 'desc',
      )
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-muted">Loading data...</div>
    )
  }

  if (!major) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <DocumentMeta title="Major not found" />
        <Link
          to={home}
          className="text-sm text-muted hover:text-ink mb-4 sm:mb-6 inline-flex items-center min-h-11 py-2"
        >
          ← Back
        </Link>
        <h1 className="font-serif text-3xl text-ink">Major not found</h1>
        <p className="text-muted mt-2 max-w-lg leading-relaxed">
          That link doesn’t match a U.S. field of study in our catalog. Try searching for
          another major in the header.
        </p>
        <Link
          to={home}
          className="mt-6 inline-flex w-full sm:w-auto justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-bright transition-colors min-h-11"
        >
          Search majors
        </Link>
      </div>
    )
  }

  const displayName = majorDisplayName(major.name)
  const all = [...relevant, ...other]
  const mapFrom = `?from=${encodeURIComponent(major.cip)}`

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
      <DocumentMeta
        title={displayName}
        description={`BLS salaries, openings, AI Risk, and Eloundou β for careers linked to ${displayName}.`}
      />
      <Link
        to={home}
        className="text-sm text-muted hover:text-ink mb-4 sm:mb-6 inline-flex items-center min-h-11 py-2"
      >
        ← Back
      </Link>

      <div className="mb-8 sm:mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2 break-words">
            {major.category} · CIP {major.cip}
          </p>
          <h1 className="font-serif text-2xl sm:text-4xl text-ink tracking-tight text-balance">
            {displayName}
          </h1>
          <p className="text-muted mt-3 max-w-xl text-sm sm:text-base leading-relaxed">
            Occupations linked to this major, with BLS entry wages, openings, competition, AI
            Risk, and Eloundou β (LLM exposure).
          </p>
        </div>
        <div className="shrink-0 w-full sm:w-auto sm:pt-6">
          <ShareSheet
            title={displayName}
            summary="BLS salaries, openings, AI Risk, and Eloundou β for careers linked to this major — from dear[CC] Field report."
          />
        </div>
      </div>

      {all.length === 0 ? (
        <p className="text-muted">No occupations found for this major.</p>
      ) : (
        <>
          <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 mb-4 text-sm overflow-x-auto overscroll-x-contain pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
            <span className="text-muted shrink-0">Sort:</span>
            <SortChip
              active={sortField === 'entrySalary'}
              label="Entry Salary"
              onClick={() => onSort('entrySalary')}
            />
            <SortChip
              active={sortField === 'openPositions'}
              label="Openings"
              onClick={() => onSort('openPositions')}
            />
            <SortChip
              active={sortField === 'graduatesPerOpening'}
              label="Competition"
              onClick={() => onSort('graduatesPerOpening')}
            />
            <SortChip
              active={sortField === 'karpathyExposure'}
              label="AI Risk"
              onClick={() => onSort('karpathyExposure')}
            />
            <SortChip
              active={sortField === 'eloundouBeta'}
              label="Eloundou β"
              onClick={() => onSort('eloundouBeta')}
            />
          </div>

          {relevant.length > 0 && (
            <OccupationTable
              title="Primary occupations"
              occupations={relevant}
              sortField={sortField}
              onSort={onSort}
              mapBase={mapBase}
              mapFrom={mapFrom}
              eloundouBySoc={eloundouBySoc}
            />
          )}
          {other.length > 0 && (
            <div className="mt-10">
              <OccupationTable
                title="Related occupations"
                occupations={other}
                sortField={sortField}
                onSort={onSort}
                mapBase={mapBase}
                mapFrom={mapFrom}
                eloundouBySoc={eloundouBySoc}
              />
            </div>
          )}

          <DigestSignup
            industry={major.category}
            role={`Student exploring ${displayName}`}
            focusAreas={[displayName, major.category, 'AI literacy']}
            sourceRef={`cip:${major.cip}`}
          />
        </>
      )}
    </div>
  )
}

function SortChip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg px-3 py-2.5 sm:py-1.5 text-sm transition-colors min-h-11 sm:min-h-0 whitespace-nowrap ${
        active
          ? 'bg-primary text-white'
          : 'text-muted hover:text-ink bg-white border border-border'
      }`}
    >
      {label}
    </button>
  )
}

function OccupationTable({
  title,
  occupations,
  sortField,
  onSort,
  mapBase,
  mapFrom,
  eloundouBySoc,
}: {
  title: string
  occupations: Occupation[]
  sortField: SortField
  onSort: (f: SortField) => void
  mapBase: string
  mapFrom: string
  eloundouBySoc: Map<string, EloundouScore>
}) {
  return (
    <section>
      <h2 className="font-serif text-xl text-ink mb-4">{title}</h2>

      <div className="md:hidden space-y-3">
        {occupations.map((occ) => (
          <OccCard
            key={occ.soc}
            occ={occ}
            mapBase={mapBase}
            mapFrom={mapFrom}
            eloundou={eloundouBySoc.get(occ.soc)}
          />
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-surface text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-medium">Occupation</th>
              <Th field="entrySalary" current={sortField} onSort={onSort}>
                Entry Salary
              </Th>
              <Th field="openPositions" current={sortField} onSort={onSort}>
                Openings
              </Th>
              <Th field="graduatesPerOpening" current={sortField} onSort={onSort}>
                Competition
              </Th>
              <th className="px-4 py-3 font-medium">
                <span className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => onSort('karpathyExposure')}
                    className={`hover:text-ink transition-colors ${
                      sortField === 'karpathyExposure' ? 'text-primary' : ''
                    }`}
                  >
                    AI Risk
                  </button>
                </span>
              </th>
              <th className="px-4 py-3 font-medium">
                <span className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => onSort('eloundouBeta')}
                    className={`hover:text-ink transition-colors ${
                      sortField === 'eloundouBeta' ? 'text-primary' : ''
                    }`}
                  >
                    Eloundou β
                  </button>
                  <InfoTip label="Eloundou β">{ELOUNDOU_COPY}</InfoTip>
                </span>
              </th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {occupations.map((occ) => (
              <OccRow
                key={occ.soc}
                occ={occ}
                mapBase={mapBase}
                mapFrom={mapFrom}
                eloundou={eloundouBySoc.get(occ.soc)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Th({
  children,
  field,
  current,
  onSort,
}: {
  children: string
  field: SortField
  current: SortField
  onSort: (f: SortField) => void
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`hover:text-ink transition-colors ${
          current === field ? 'text-primary' : ''
        }`}
      >
        {children}
      </button>
    </th>
  )
}

function OccRow({
  occ,
  mapBase,
  mapFrom,
  eloundou,
}: {
  occ: Occupation
  mapBase: string
  mapFrom: string
  eloundou?: EloundouScore
}) {
  const competition = occ.competitionLevel as CompetitionLevel | null
  const compMeta = competition ? COMPETITION_COPY[competition] : null

  return (
    <tr className="border-t border-border hover:bg-surface/80 group">
      <td className="px-4 py-4">
        <div className="font-medium text-ink">{occ.title}</div>
        <div className="text-xs text-muted font-mono mt-0.5">SOC {occ.soc}</div>
      </td>
      <td className="px-4 py-4">
        <div className="font-mono text-ink">{formatSalary(occ.entrySalary)}</div>
        <div className="text-xs text-muted mt-0.5">
          median {formatSalary(occ.medianSalary)}
        </div>
      </td>
      <td className="px-4 py-4 font-mono text-ink/80">
        {formatNumber(occ.openPositions)}
      </td>
      <td className="px-4 py-4">
        {compMeta ? (
          <div className="flex items-start gap-0.5">
            <div>
              <span style={{ color: compMeta.color }} className="font-medium">
                {compMeta.label}
              </span>
              <div className="text-xs text-muted font-mono mt-0.5">
                {formatRatio(occ.graduatesPerOpening)} grads/opening
              </div>
            </div>
            <InfoTip label="competition">{compMeta.blurb}</InfoTip>
          </div>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-4">
        <KarpathyCell occ={occ} />
      </td>
      <td className="px-4 py-4">
        <EloundouCell score={eloundou} />
      </td>
      <td className="px-4 py-4 text-right">
        <Link
          to={`${mapBase}/${occ.soc}${mapFrom}`}
          className="text-primary hover:text-primary-bright text-xs font-medium"
        >
          Map →
        </Link>
      </td>
    </tr>
  )
}

function OccCard({
  occ,
  mapBase,
  mapFrom,
  eloundou,
}: {
  occ: Occupation
  mapBase: string
  mapFrom: string
  eloundou?: EloundouScore
}) {
  const competition = occ.competitionLevel as CompetitionLevel | null
  const compMeta = competition ? COMPETITION_COPY[competition] : null

  return (
    <article className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-ink leading-snug">{occ.title}</h3>
          <p className="text-xs text-muted font-mono mt-0.5">SOC {occ.soc}</p>
        </div>
        <Link
          to={`${mapBase}/${occ.soc}${mapFrom}`}
          className="shrink-0 inline-flex items-center rounded-lg border border-primary/30 px-3 py-2 text-primary text-sm font-medium min-h-11 hover:bg-primary/5"
        >
          Map →
        </Link>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-muted">Entry salary</dt>
          <dd className="font-mono text-ink mt-0.5 break-words">
            {formatSalary(occ.entrySalary)}
          </dd>
          <p className="text-[11px] text-muted mt-0.5">
            median {formatSalary(occ.medianSalary)}
          </p>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted">Openings</dt>
          <dd className="font-mono text-ink mt-0.5">
            {formatNumber(occ.openPositions)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted inline-flex items-center">
            Competition
            {compMeta && <InfoTip label="competition">{compMeta.blurb}</InfoTip>}
          </dt>
          <dd className="mt-0.5">
            {compMeta ? (
              <>
                <span style={{ color: compMeta.color }} className="font-medium">
                  {compMeta.label}
                </span>
                <p className="text-[11px] text-muted font-mono mt-0.5">
                  {formatRatio(occ.graduatesPerOpening)} grads/opening
                </p>
              </>
            ) : (
              <span className="text-muted">—</span>
            )}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted inline-flex items-center">
            AI Risk
            <InfoTip label="AI risk">
              {occ.karpathyRationale ||
                AI_BAND_COPY[aiBandFromScore(occ.karpathyExposure)] ||
                'Band-level explanation; no per-title rationale available.'}
            </InfoTip>
          </dt>
          <dd className="mt-0.5">
            <KarpathyCell occ={occ} tip={false} />
          </dd>
        </div>
        <div className="min-w-0 col-span-2">
          <dt className="text-xs text-muted inline-flex items-center">
            Eloundou β
            <InfoTip label="Eloundou β">{ELOUNDOU_COPY}</InfoTip>
          </dt>
          <dd className="mt-0.5">
            <EloundouCell score={eloundou} tip={false} />
          </dd>
        </div>
      </dl>
    </article>
  )
}

function KarpathyCell({ occ, tip = true }: { occ: Occupation; tip?: boolean }) {
  const band = aiBandFromScore(occ.karpathyExposure)
  const aiBlurb =
    occ.karpathyRationale ||
    AI_BAND_COPY[band] ||
    'Band-level explanation; no per-title rationale available.'

  return (
    <div className="flex items-start gap-0.5">
      <div>
        <span className="font-mono text-ink">
          {occ.karpathyExposure != null ? `${occ.karpathyExposure}/10` : '—'}
        </span>
        <div className="text-xs text-muted mt-0.5">{band}</div>
      </div>
      {tip ? <InfoTip label="AI risk">{aiBlurb}</InfoTip> : null}
    </div>
  )
}

function EloundouCell({
  score,
  tip = true,
}: {
  score?: EloundouScore
  tip?: boolean
}) {
  if (!score || score.gptBeta == null) {
    return <span className="text-muted">—</span>
  }

  return (
    <div>
      <div className="flex items-start gap-0.5">
        <div>
          <span className="font-mono text-ink">{formatShare(score.gptBeta)}</span>
          <div
            className="text-xs mt-0.5 font-medium"
            style={{ color: score.band ? ELOUNDOU_BAND_COLORS[score.band] : undefined }}
          >
            {score.band ?? '—'}
          </div>
        </div>
        {tip ? <InfoTip label="Eloundou β">{ELOUNDOU_COPY}</InfoTip> : null}
      </div>
      <div className="text-[10px] text-muted font-mono mt-1 flex flex-wrap items-center gap-x-1">
        <span>α {formatShare(score.gptAlpha)}</span>
        <span>·</span>
        <span>γ {formatShare(score.gptGamma)}</span>
        <InfoTip label="α and γ">
          <p className="mb-2">{ELOUNDOU_ALPHA_COPY}</p>
          <p>{ELOUNDOU_GAMMA_COPY}</p>
          <p className="mt-2 text-muted">β (shown above) blends both measures.</p>
        </InfoTip>
      </div>
    </div>
  )
}

function compareOcc(
  a: Occupation,
  b: Occupation,
  field: SortField,
  direction: SortDirection,
  eloundouBySoc: Map<string, EloundouScore>,
): number {
  const aCatch = isCatchAllOccupation(a)
  const bCatch = isCatchAllOccupation(b)
  if (aCatch !== bCatch) return aCatch ? 1 : -1

  const av =
    field === 'eloundouBeta'
      ? (eloundouBySoc.get(a.soc)?.gptBeta ?? null)
      : a[field as keyof Occupation]
  const bv =
    field === 'eloundouBeta'
      ? (eloundouBySoc.get(b.soc)?.gptBeta ?? null)
      : b[field as keyof Occupation]

  const aNum = typeof av === 'number' ? av : null
  const bNum = typeof bv === 'number' ? bv : null
  const aMissing = aNum == null || Number.isNaN(aNum)
  const bMissing = bNum == null || Number.isNaN(bNum)
  if (aMissing && bMissing) return a.title.localeCompare(b.title)
  if (aMissing) return 1
  if (bMissing) return -1
  const cmp = aNum === bNum ? a.title.localeCompare(b.title) : aNum - bNum
  return direction === 'asc' ? cmp : -cmp
}
