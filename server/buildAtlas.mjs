/**
 * v4 national hiring atlas: CIP → primary cluster → rated employers per metro.
 */
import { aoiDsl } from './aoiClient.mjs'
import { loadCatalog, resolveDisplayGroups } from './buildFieldReport.mjs'
import { METROS, dslString, mapPool } from './metros.mjs'

/** @type {Map<string, { at: number, atlas: object }>} */
const cache = new Map()
const CACHE_TTL_MS = 60 * 60 * 1000

function summarizeRows(rows) {
  const rated = rows.filter((r) => r.badge_early_career)
  const platinum = rated.filter((r) => r.badge_early_career === 'Platinum')
  const highHiring = rated.filter(
    (r) => r.entry_posting_tier === 'high' || r.total_posting_tier === 'high',
  )
  const names = [...new Set(rated.map((r) => r.company_name).filter(Boolean))]
  return {
    employers: rated.length,
    platinum: platinum.length,
    highHiring: highHiring.length,
    names,
    samples: platinum
      .map((r) => r.company_name)
      .filter(Boolean)
      .slice(0, 6),
  }
}

async function fetchMetroCluster(clusterId, cbsa) {
  const q = `LIST COMPANIES FOR CLUSTER "${clusterId}" WHERE CBSA IS "${dslString(cbsa)}" AND BADGE_EARLY_CAREER IS NOT NULL LIMIT 100`
  try {
    const res = await aoiDsl(q)
    return Array.isArray(res.data) ? res.data : []
  } catch {
    return []
  }
}

/**
 * @param {{ cip: string }} args
 */
export async function buildAtlas({ cip }) {
  if (!/^\d{2}\.\d{4}$/.test(cip)) {
    throw Object.assign(new Error('Invalid CIP'), { status: 400 })
  }

  const hit = cache.get(cip)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { ...hit.atlas, cached: true }
  }

  const catalog = await loadCatalog()
  const major = catalog.majors.find((m) => m.cip === cip)
  const groups = await resolveDisplayGroups(cip, catalog)
  const primary = groups[0]
  const clusterId = primary.clusterIds[0]

  const metrosRaw = await mapPool(METROS, 6, async (m) => {
    const rows = await fetchMetroCluster(clusterId, m.cbsa)
    const stats = summarizeRows(rows)
    return {
      cbsa: m.cbsa,
      cbsaName: m.cbsaName,
      short: m.short,
      zip: m.seeds[0],
      lat: m.lat,
      lng: m.lng,
      msaSize: m.msaSize,
      employers: stats.employers,
      platinum: stats.platinum,
      highHiring: stats.highHiring,
      samples: stats.samples,
      employerNames: stats.names,
    }
  })

  const metros = metrosRaw
    .filter((m) => m.employers > 0)
    .sort((a, b) => b.employers - a.employers)

  const atlas = {
    cip: { code: cip, title: major?.name || cip },
    cluster: {
      id: clusterId,
      name: primary.displayName,
      vendorNames: primary.vendorNames,
    },
    groups: groups.map((g) => ({
      id: g.id,
      displayName: g.displayName,
      clusterIds: g.clusterIds,
    })),
    metros,
    totals: {
      metrosWithHiring: metros.length,
      employersPeak: metros[0]?.employers || 0,
      platinumPeak: Math.max(0, ...metros.map((m) => m.platinum)),
    },
    coverage: {
      text: 'Bubbles count rated early-career employers hiring this field in each metro (AOI hiring_flag × company badges). A company not shown has not been rated — that is not a judgment about it.',
      source:
        'American Opportunity Index / Where You Work Matters — Burning Glass Institute and Schultz Family Foundation, via AOI. Observation window predominantly 2019–2024. Prototype scans 40 large metros.',
    },
    source: {
      provider: 'AOI / WYWM (aonav.ai) live',
      builtAt: new Date().toISOString(),
    },
  }

  cache.set(cip, { at: Date.now(), atlas })
  return atlas
}
