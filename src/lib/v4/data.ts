import type { FieldReport } from '../v3/types'
import type { AtlasPayload, FootprintPayload, V4SkillGroup, V4WageGroup } from './types'

export type V4FieldReport = FieldReport & {
  wagesByGroup?: V4WageGroup[]
  skillsByGroup?: V4SkillGroup[]
  atlasPreview?: {
    cluster: { id: number; name: string }
    metros: {
      zip: string
      cbsa: string
      cbsaName: string
      short: string
      employersHiring: number
      platinum: number
      isCurrent: boolean
      lat: number
      lng: number
    }[]
    totals: { metrosWithHiring: number; employersPeak: number }
  } | null
  namedEmployers?: boolean
  variant?: string
}

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  const type = res.headers.get('content-type') || ''
  const text = await res.text()
  if (!type.includes('application/json')) {
    throw new Error(text.slice(0, 200) || fallback)
  }
  const body = JSON.parse(text) as { error?: string } & T
  if (!res.ok) {
    throw Object.assign(new Error(body?.error || fallback), { status: res.status })
  }
  return body as T
}

export async function fetchAtlas(cip: string): Promise<AtlasPayload> {
  const qs = new URLSearchParams({ cip })
  const res = await fetch(`/api/v4/atlas?${qs}`)
  return readJson<AtlasPayload>(res, 'Could not build hiring atlas')
}

export async function fetchV4Report(cip: string, zip: string): Promise<V4FieldReport> {
  const qs = new URLSearchParams({ cip, zip })
  const res = await fetch(`/api/v4/report?${qs}`)
  return readJson<V4FieldReport>(res, 'Could not build v4 report')
}

export async function fetchFootprint(
  cip: string,
  company: string,
): Promise<FootprintPayload> {
  const qs = new URLSearchParams({ cip, company })
  const res = await fetch(`/api/v4/footprint?${qs}`)
  return readJson<FootprintPayload>(res, 'Could not build company footprint')
}

export async function fetchCompare(cip: string, zipA: string, zipB: string) {
  const qs = new URLSearchParams({ cip, zipA, zipB })
  const res = await fetch(`/api/v4/compare?${qs}`)
  return readJson<ComparePayload>(res, 'Could not compare metros')
}

export async function fetchPathways(cip: string) {
  const qs = new URLSearchParams({ cip })
  const res = await fetch(`/api/v4/pathways?${qs}`)
  return readJson<PathwaysPayload>(res, 'Could not build pathways')
}

export async function fetchBadges(cip: string) {
  const qs = new URLSearchParams({ cip })
  const res = await fetch(`/api/v4/badges?${qs}`)
  return readJson<BadgesPayload>(res, 'Could not build badge matrix')
}

export async function fetchVersus(cipA: string, cipB: string) {
  const qs = new URLSearchParams({ a: cipA, b: cipB })
  const res = await fetch(`/api/v4/versus?${qs}`)
  return readJson<VersusPayload>(res, 'Could not compare majors')
}

export async function fetchIndustries(cip: string) {
  const qs = new URLSearchParams({ cip })
  const res = await fetch(`/api/v4/industries?${qs}`)
  return readJson<IndustriesPayload>(res, 'Could not build industry mix')
}

export type BadgeTiers = { platinum: number; gold: number; ranked: number }

export type CompareSide = {
  place: { zip: string; cbsa: string; cbsaName: string; msaSize: string }
  funnel: { ratedInField: number; hiringHere: number }
  platinum: number
  core: number
  employers: { name: string; badge: string; industry: string | null; top10: boolean }[]
  groups: {
    name: string
    promotion: { internalPct: number; externalPct: number; verdict: string } | null
    door: { heading: string; barrier?: string; premium?: string } | null
  }[]
  atlas: { employers: number; platinum: number; short: string } | null
}

export type ComparePayload = {
  cip: { code: string; title: string }
  left: CompareSide
  right: CompareSide
  coverage: { text: string; source: string }
}

export type PathwayRow = {
  clusterId: number
  name: string
  jobLevel: string | null
  aiFlag: string | null
  skills: string[]
  internalPct: number | null
  externalPct: number | null
  retentionPct: number | null
}

export type PathwaysPayload = {
  cip: { code: string; title: string }
  groups: {
    groupId: number
    displayName: string
    clusterId: number
    adjacent: PathwayRow[]
    destinations: PathwayRow[]
  }[]
  coverage: { text: string; source: string }
}

export type BadgesPayload = {
  cip: { code: string; title: string }
  cluster: { id: number; name: string }
  matrix: {
    early_career: BadgeTiers
    growth: BadgeTiers
    stability: BadgeTiers
  } | null
  groupMatrices: { name: string; clusterId: number; matrix: BadgesPayload['matrix'] }[]
  industries: { industry: string; count: number }[]
  platinumHigh: {
    company: string
    badgeGrowth: string | null
    badgeStability: string | null
    industry: string | null
  }[]
  coverage: { text: string; source: string }
}

export type VersusSide = {
  cip: { code: string; title: string }
  cluster: { id: number; name: string }
  groups: string[]
  wages: { entry: number | null; year5: number | null; year10: number | null }
  ai: { flag: string | null; barrier: string | null; premium: string | null } | null
  matrix: BadgesPayload['matrix']
  ratedPairs: number
  topIndustry: { name: string; count: number } | null
  employers: { name: string; badge: string; industry: string | null }[]
}

export type VersusPayload = {
  left: VersusSide
  right: VersusSide
  coverage: { text: string; source: string }
}

export type IndustriesPayload = {
  cip: { code: string; title: string }
  cluster: { id: number; name: string }
  totalPairs: number
  industries: {
    name: string
    count: number
    share: number
    samples: string[]
  }[]
  coverage: { text: string; source: string }
}
