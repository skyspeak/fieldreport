/** Field Report v3 types — aligned with field-report-v3-spec.md §3.2 */

export type MsaSize = 'Large' | 'Small/Medium'

export type DisplayGroup = {
  id: number
  displayName: string
  displayBlurb: string
  clusterIds: number[]
  vendorNames: string[]
  destinations: { clusterId: number; name: string; jobLevel?: string | null }[]
  promotion: {
    internalPct: number
    externalPct: number
    verdict: string
  } | null
  door: {
    barrier: string
    premium: string
    aiFlag: string | null
    methodologyVersion: string | null
    heading: string
    body: string
  } | null
}

export type Employer = {
  companyUid: string
  companyName: string
  companyUrl: string | null
  primaryIndustry: string | null
  badgeEarlyCareer: 'Platinum' | 'Gold' | string
  badgeGrowth: string | null
  hiringIntensity: 1 | 2 | number
  top10: boolean
  groupIds: number[]
  entryPostingTier?: string | null
  metroLabel?: string | null
}

export type MetroOption = {
  zip: string
  cbsa: string
  cbsaName: string
  employersHiring: number
  isCurrent: boolean
  score: number
}

export type FieldReport = {
  cip: { code: string; title: string }
  place: {
    zip: string
    cbsa: string
    cbsaName: string
    msaSize: MsaSize
    scope?: 'metro' | 'national'
  }
  funnel: { totalRated: number; ratedInField: number; hiringHere: number }
  groups: DisplayGroup[]
  employers: Employer[]
  destinations: {
    clusterId: number
    name: string
    fromGroupId: number
    fromGroupName: string
  }[]
  door: {
    groupId: number
    groupName: string
    barrier?: string
    premium?: string
    heading?: string
    body?: string
    aiFlag?: string | null
    methodologyVersion?: string | null
  }[]
  metros: MetroOption[]
  coverage: { text: string }
  radiusExpanded: boolean
  source?: { provider: string; builtAt: string }
}

export type PlaceRow = {
  zip: string
  cbsa: string
  cbsaName: string
  msaSize: MsaSize
  seed?: boolean
}
