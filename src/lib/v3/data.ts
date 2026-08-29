import type { FieldReport, PlaceRow } from './types'

export const NAMED_EMPLOYERS =
  String(import.meta.env.VITE_FEATURE_NAMED_EMPLOYERS || '').toLowerCase() ===
  'true'

export const COVERAGE_NOTE =
  'This list covers companies rated for early-career hiring. A company not shown here has not been rated, which is not a judgment about it.'

function placesUrl() {
  return `${import.meta.env.BASE_URL}data/places.json`.replace(/\/{2,}/g, '/')
}

/** Live AOI-backed report for any CIP + ZIP. */
export async function fetchLiveFieldReport(
  cip: string,
  zip: string,
): Promise<FieldReport> {
  const qs = new URLSearchParams({ cip, zip })
  const res = await fetch(`/api/v3/report?${qs}`)
  const type = res.headers.get('content-type') || ''
  const text = await res.text()
  if (!type.includes('application/json')) {
    throw new Error(
      text.slice(0, 200) ||
        'Report API returned non-JSON. Check AOI credentials and the /api/v3/report deploy.',
    )
  }
  const body = JSON.parse(text) as { error?: string } & FieldReport
  if (!res.ok) {
    throw Object.assign(new Error(body?.error || 'Could not build report'), {
      status: res.status,
    })
  }
  return body as FieldReport
}

/** Seed metros for Map / ZIP chips. */
export async function loadPlaces(): Promise<PlaceRow[]> {
  try {
    const res = await fetch(placesUrl())
    if (!res.ok) return []
    const type = res.headers.get('content-type') || ''
    if (!type.includes('application/json')) return []
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
