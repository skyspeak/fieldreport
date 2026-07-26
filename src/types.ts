export interface Major {
  cip: string
  name: string
  category: string
}

export interface Occupation {
  soc: string
  title: string
  entrySalary: number
  medianSalary: number
  totalEmployment: number
  openPositions: number
  graduatesPerOpening: number | null
  competitionLevel: CompetitionLevel | null
  karpathyExposure: number | null
  karpathyRationale: string | null
}

export type CompetitionLevel = 'Low' | 'Moderate' | 'High' | 'Very High'

export interface CrosswalkEntry {
  primary: string[]
  related: string[]
}

export type Crosswalk = Record<string, CrosswalkEntry>

export interface StateOccupationStats {
  employment: number
  medianSalary: number
}

export interface StateData {
  name: string
  occupations: Record<string, StateOccupationStats>
}

export type StatesFile = Record<string, StateData>

export type SortField =
  | 'entrySalary'
  | 'openPositions'
  | 'graduatesPerOpening'
  | 'karpathyExposure'
  | 'eloundouBeta'

export type SortDirection = 'asc' | 'desc'

export type MapColorBy = 'employment' | 'salary' | 'aiImpact'

export interface EloundouScore {
  soc: string
  title: string
  onetCount: number
  gptAlpha: number | null
  gptBeta: number | null
  gptGamma: number | null
  humanAlpha: number | null
  humanBeta: number | null
  humanGamma: number | null
  band: 'Low' | 'Moderate' | 'High' | 'Very High' | null
}

export interface EloundouFile {
  source: string
  repo: string
  measures: Record<string, string>
  aggregation: string
  generatedAt: string
  coverage: { occupations: number; matched: number; pct: number }
  bySoc: Record<string, EloundouScore>
}
