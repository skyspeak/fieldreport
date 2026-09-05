import type { Crosswalk, Occupation, UnobviousPath } from '../types'

/** 4-digit CIP family from a 6-digit code, e.g. 11.0701 → 11.07 */
export function cip4(cip: string): string {
  return cip.slice(0, 5)
}

export function pathForCip(
  cip: string,
  byCip4: Map<string, UnobviousPath>,
  byCip2?: Map<string, UnobviousPath>,
  byCip?: Map<string, UnobviousPath>,
): UnobviousPath | undefined {
  return byCip?.get(cip) ?? byCip4.get(cip4(cip)) ?? byCip2?.get(cip.slice(0, 2))
}

export function newPathSocs(path: UnobviousPath | undefined): Set<string> {
  const socs = new Set<string>()
  if (!path) return socs
  for (const job of path.jobs) {
    if (job.soc) socs.add(job.soc)
  }
  return socs
}

/** Exact-CIP and curated 4-digit families keep their editorial traditional job. */
export function traditionalEntry(
  path: UnobviousPath,
  cip: string,
  majorName: string | undefined,
  crosswalk: Crosswalk,
  occupationsBySoc: Map<string, Occupation>,
): string {
  if (path.cip || path.cip4) return path.not
  return (
    deriveTraditional(cip, majorName, crosswalk, occupationsBySoc) ?? path.not
  )
}

function deriveTraditional(
  cip: string,
  majorName: string | undefined,
  crosswalk: Crosswalk,
  occupationsBySoc: Map<string, Occupation>,
): string | undefined {
  const entry = crosswalk[cip]
  if (!entry?.primary?.length) return undefined
  const tokens = words(majorName ?? '')
  const edMajor = /\b(education|teaching|teacher)\b/.test((majorName ?? '').toLowerCase())

  let best: { score: number; title: string } | undefined
  for (const soc of entry.primary) {
    const occ = occupationsBySoc.get(soc)
    if (!occ) continue
    const titleWords = words(occ.title)
    const overlap = [...tokens].filter((t) => titleWords.has(t)).length
    const teacher = /teacher/i.test(occ.title)
    let score = overlap * 12 + Math.log10(Math.max(occ.openPositions, 1))
    if (teacher && !edMajor) score -= 4
    if (teacher && edMajor) score += 8
    if (!best || score > best.score) best = { score, title: occ.title }
  }
  return best ? shortJob(best.title) : undefined
}

function words(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((w) => w.length > 2 && !STOP.has(w)),
  )
}

const STOP = new Set([
  'and',
  'the',
  'for',
  'with',
  'other',
  'general',
  'except',
  'all',
  'services',
  'related',
  'studies',
])

function shortJob(title: string): string {
  let t = title.replace(/\s+Teachers?, Postsecondary$/i, ' teacher')
  t = t.replace(/, Postsecondary$/i, ' teacher')
  const head = t.split(',')[0]?.trim() ?? t
  return (head || title).toLowerCase()
}
