import type { FieldReport, PlaceRow } from './types'

export const NAMED_EMPLOYERS =
  String(import.meta.env.VITE_FEATURE_NAMED_EMPLOYERS || '').toLowerCase() ===
  'true'

export const COVERAGE_NOTE =
  'This list covers companies rated for early-career hiring. A company not shown here has not been rated, which is not a judgment about it.'

/** Live AOI-backed report for any CIP + ZIP. */
export async function fetchLiveFieldReport(
  cip: string,
  zip: string,
): Promise<FieldReport> {
  const qs = new URLSearchParams({ cip, zip })
  const res = await fetch(`/api/v3/report?${qs}`)
  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) {
    throw new Error(
      'Report API returned non-JSON. Is the Vite/Vercel AOI API running?',
    )
  }
  const body = await res.json()
  if (!res.ok) {
    throw Object.assign(new Error(body?.error || 'Could not build report'), {
      status: res.status,
    })
  }
  return body as FieldReport
}

/** @deprecated static places — kept for ZIP prompt seed chips */
export async function loadPlaces(): Promise<PlaceRow[]> {
  try {
    const res = await fetch(
      `${import.meta.env.BASE_URL}data/v3/places.json`.replace(/\/{2,}/g, '/'),
    )
    if (!res.ok) return []
    const body = (await res.json()) as { places: PlaceRow[] }
    return body.places || []
  } catch {
    return []
  }
}

export async function loadSupportedCips(): Promise<
  { code: string; title: string }[]
> {
  // Live mode supports every major with a CIP–SOC mapping.
  return []
}
