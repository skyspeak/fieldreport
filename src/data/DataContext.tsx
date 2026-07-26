import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Crosswalk,
  EloundouFile,
  EloundouScore,
  Major,
  Occupation,
  StatesFile,
} from '../types'
import { assetUrl } from '../lib/assetUrl'
import { isRealMajor, majorDisplayName } from '../lib/majorName'

interface DataContextValue {
  majors: Major[]
  occupations: Occupation[]
  occupationsBySoc: Map<string, Occupation>
  crosswalk: Crosswalk
  eloundouBySoc: Map<string, EloundouScore>
  eloundouMeta: Omit<EloundouFile, 'bySoc'> | null
  stateData: StatesFile | null
  loading: boolean
  error: string | null
  loadStateData: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: import.meta.env.DEV ? 'no-cache' : 'force-cache',
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json() as Promise<T>
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [majors, setMajors] = useState<Major[]>([])
  const [occupations, setOccupations] = useState<Occupation[]>([])
  const [crosswalk, setCrosswalk] = useState<Crosswalk>({})
  const [eloundouFile, setEloundouFile] = useState<EloundouFile | null>(null)
  const [stateData, setStateData] = useState<StatesFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stateLoading, setStateLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [m, o, c, e] = await Promise.all([
          fetchJson<Major[]>(assetUrl('data/majors.json')),
          fetchJson<Occupation[]>(assetUrl('data/occupations.json')),
          fetchJson<Crosswalk>(assetUrl('data/crosswalk.json')),
          fetchJson<EloundouFile>(assetUrl('data/eloundou.json')),
        ])
        if (cancelled) return
        setMajors(
          m
            .filter((major) => isRealMajor(major.cip))
            .map((major) => ({
              ...major,
              name: majorDisplayName(major.name),
            })),
        )
        setOccupations(o)
        setCrosswalk(c)
        setEloundouFile(e)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadStateData = useCallback(async () => {
    if (stateData || stateLoading) return
    setStateLoading(true)
    try {
      const data = await fetchJson<StatesFile>(assetUrl('data/states.json'))
      setStateData(data)
    } catch (err) {
      console.error('Failed to load state data:', err)
    } finally {
      setStateLoading(false)
    }
  }, [stateData, stateLoading])

  const occupationsBySoc = useMemo(() => {
    const map = new Map<string, Occupation>()
    for (const occ of occupations) map.set(occ.soc, occ)
    return map
  }, [occupations])

  const eloundouBySoc = useMemo(() => {
    const map = new Map<string, EloundouScore>()
    if (!eloundouFile) return map
    for (const [soc, score] of Object.entries(eloundouFile.bySoc)) map.set(soc, score)
    return map
  }, [eloundouFile])

  const eloundouMeta = useMemo(() => {
    if (!eloundouFile) return null
    const { bySoc: _, ...meta } = eloundouFile
    return meta
  }, [eloundouFile])

  const value = useMemo(
    () => ({
      majors,
      occupations,
      occupationsBySoc,
      crosswalk,
      eloundouBySoc,
      eloundouMeta,
      stateData,
      loading,
      error,
      loadStateData,
    }),
    [
      majors,
      occupations,
      occupationsBySoc,
      crosswalk,
      eloundouBySoc,
      eloundouMeta,
      stateData,
      loading,
      error,
      loadStateData,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
