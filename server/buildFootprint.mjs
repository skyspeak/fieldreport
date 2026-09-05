/**
 * v4 company footprint: where a named employer hires this major's clusters.
 */
import { aoiDsl } from './aoiClient.mjs'
import { buildAtlas } from './buildAtlas.mjs'
import { loadCatalog, resolveDisplayGroups } from './buildFieldReport.mjs'
import { dslString, lookupCbsa } from './metros.mjs'

function intensity(qtile) {
  const n = Number(qtile)
  if (n >= 3) return 3
  if (n >= 2) return 2
  if (n >= 1) return 1
  return 0
}

/**
 * @param {{ cip: string, company: string }} args
 */
export async function buildFootprint({ cip, company }) {
  if (!/^\d{2}\.\d{4}$/.test(cip)) {
    throw Object.assign(new Error('Invalid CIP'), { status: 400 })
  }
  const name = String(company || '').trim()
  if (!name || name.length > 120) {
    throw Object.assign(new Error('Company name required'), { status: 400 })
  }

  const catalog = await loadCatalog()
  const major = catalog.majors.find((m) => m.cip === cip)
  const groups = await resolveDisplayGroups(cip, catalog)
  const clusterIds = new Set(groups.flatMap((g) => g.clusterIds.map(Number)))

  /** @type {Map<string, { cbsa: string, cbsaName: string, short: string, lat: number, lng: number, zip: string | null, intensity: number, clusters: string[], fromAtlas: boolean, fromHiring: boolean }>} */
  const byCbsa = new Map()

  function addMetro(row) {
    if (row.lat == null || row.lng == null) return
    const key = String(row.cbsa)
    const prev = byCbsa.get(key)
    if (!prev) {
      byCbsa.set(key, { ...row, clusters: [...(row.clusters || [])] })
      return
    }
    prev.intensity = Math.max(prev.intensity, row.intensity || 0)
    prev.fromAtlas = prev.fromAtlas || row.fromAtlas
    prev.fromHiring = prev.fromHiring || row.fromHiring
    for (const c of row.clusters || []) {
      if (!prev.clusters.includes(c)) prev.clusters.push(c)
    }
  }

  const atlas = await buildAtlas({ cip })
  const needle = name.toLowerCase()
  for (const m of atlas.metros) {
    const hit = (m.employerNames || []).some((n) => String(n).toLowerCase() === needle)
    if (!hit) continue
    addMetro({
      cbsa: m.cbsa,
      cbsaName: m.cbsaName,
      short: m.short,
      lat: m.lat,
      lng: m.lng,
      zip: m.zip,
      intensity: 2,
      clusters: [atlas.cluster.name],
      fromAtlas: true,
      fromHiring: false,
    })
  }

  try {
    const res = await aoiDsl(
      `GET HIRING FOR COMPANY WHERE COMPANY IS "${dslString(name)}" LIMIT 1000`,
    )
    const rows = Array.isArray(res.data) ? res.data : []
    for (const row of rows) {
      const cid = Number(row.cluster_id)
      if (!clusterIds.has(cid)) continue
      const place = lookupCbsa(row.cbsa)
      if (!place) continue
      addMetro({
        cbsa: place.cbsa,
        cbsaName: place.cbsaName || row.cbsa_name,
        short: place.short,
        lat: place.lat,
        lng: place.lng,
        zip: place.zip,
        intensity: intensity(row.postings_count_qtile),
        clusters: [row.cluster_name].filter(Boolean),
        fromAtlas: false,
        fromHiring: true,
      })
    }
  } catch {
    /* atlas overlay still useful */
  }

  const metros = [...byCbsa.values()].sort((a, b) => b.intensity - a.intensity || a.short.localeCompare(b.short))

  return {
    cip: { code: cip, title: major?.name || cip },
    company: name,
    cluster: atlas.cluster,
    groups: atlas.groups,
    metros,
    totals: { metros: metros.length },
    coverage: {
      text: 'Metros where this employer is rated for early-career hiring in your field (atlas overlay) and/or has a hiring_flag row in these occupation clusters. Missing metros mean unrated or uncovered — not a judgment.',
      source:
        'American Opportunity Index / WYWM — Burning Glass Institute and Schultz Family Foundation, via AOI. 2019–2024 postings window.',
    },
    source: {
      provider: 'AOI / WYWM (aonav.ai) live',
      builtAt: new Date().toISOString(),
    },
  }
}
