import { useLocation } from 'react-router-dom'

/** Canonical app paths for `/`, legacy `/v2`, and redirected `/v3` URLs. */
export function useAppPaths() {
  const { pathname } = useLocation()
  const isV3 = pathname.startsWith('/v3')
  const isV2 = pathname.startsWith('/v2')
  // Employer metro pages live on main (and /v2) now — not under /v3.
  const prefix = isV2 ? '/v2' : ''
  return {
    isV2,
    isV3,
    isReport: true,
    prefix,
    home: prefix || '/',
    resultsBase: `${prefix}/results`,
    mapBase: `${prefix}/map`,
    receipts: `${prefix}/receipts`,
  } as const
}
