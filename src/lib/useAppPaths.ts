import { useLocation } from 'react-router-dom'

/** Canonical app paths for `/` and legacy `/v2` aliases. */
export function useAppPaths() {
  const { pathname } = useLocation()
  const isV2 = pathname.startsWith('/v2')
  const prefix = isV2 ? '/v2' : ''
  return {
    isV2,
    prefix,
    home: prefix || '/',
    resultsBase: `${prefix}/results`,
    mapBase: `${prefix}/map`,
  } as const
}
