export type AtlasMetro = {
  cbsa: string
  cbsaName: string
  short: string
  zip: string
  lat: number
  lng: number
  msaSize?: string
  employers: number
  platinum: number
  highHiring: number
  samples?: string[]
}

export type AtlasPayload = {
  cip: { code: string; title: string }
  cluster: { id: number; name: string; vendorNames: string[] }
  groups: { id: number; displayName: string; clusterIds: number[] }[]
  metros: AtlasMetro[]
  totals: { metrosWithHiring: number; employersPeak: number; platinumPeak: number }
  coverage: { text: string; source: string }
  source?: { provider: string; builtAt: string }
  cached?: boolean
}

export type FootprintMetro = {
  cbsa: string
  cbsaName: string
  short: string
  lat: number
  lng: number
  zip: string | null
  intensity: number
  clusters: string[]
  fromAtlas: boolean
  fromHiring: boolean
}

export type FootprintPayload = {
  cip: { code: string; title: string }
  company: string
  cluster: { id: number; name: string }
  metros: FootprintMetro[]
  totals: { metros: number }
  coverage: { text: string; source: string }
  source?: { provider: string; builtAt: string }
}

export type WageBand = { p25: number; median: number; p75: number } | null

export type V4WageGroup = {
  groupId: number
  groupName: string
  onet?: string | null
  title?: string
  msaSize: string
  entry: WageBand
  year5: WageBand
  year10: WageBand
}

export type V4SkillGroup = {
  groupId: number
  groupName: string
  jobLevel: string | null
  baPlusShare: number | null
  aiFlag: string | null
  premiumSkills: string[]
  jobTitles: string[]
}
