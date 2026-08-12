import { useLocation } from 'react-router-dom'

/** Canonical app paths for `/`, legacy `/v2`, and `/v3` employer layer. */
export function useAppPaths() {
  const { pathname } = useLocation()
  const isV3 = pathname.startsWith('/v3')
  const isV2 = pathname.startsWith('/v2')
  const prefix = isV3 ? '/v3' : isV2 ? '/v2' : ''
  return {
    isV2,
    isV3,
    prefix,
    home: prefix || '/',
    resultsBase: `${prefix}/results`,
    mapBase: `${prefix}/map`,
    receipts: isV3 ? '/v3/receipts' : `${prefix}/receipts`,
  } as const
}
