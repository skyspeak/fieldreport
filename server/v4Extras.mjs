/**
 * v4 extras: metro compare, pathways, badge matrix, major vs major, industry mix.
 */
import { aoiDsl } from './aoiClient.mjs'
import { buildAtlas } from './buildAtlas.mjs'
import { buildFieldReport, loadCatalog, resolveDisplayGroups } from './buildFieldReport.mjs'

const SOURCE =
  'American Opportunity Index / WYWM — Burning Glass Institute and Schultz Family Foundation, via AOI. Observation window predominantly 2019–2024.'

function stamp() {
  return { provider: 'AOI / WYWM (aonav.ai) live', builtAt: new Date().toISOString() }
}

function pct(n) {
  if (n == null || Number.isNaN(n)) return null
  return Math.round(n * 100)
}

function pickWage(segments, years, msaSize = 'Large') {
  const want = msaSize === 'Small/Medium' ? 'Small/Medium' : 'Large'
  const row = (segments || []).find(
    (s) => s.msa_size === want && String(s.experience_level) === String(years),
  )
  return row ? Math.round(row.median) : null
}

async function fetchWages(onet) {
  if (!onet) return []
  try {
    const res = await aoiDsl(`GET WAGES FOR OCCUPATION WHERE ONET_CODE IS "${onet}"`)
    return Array.isArray(res.data?.wages_by_segment) ? res.data.wages_by_segment : []
  } catch {
    return []
  }
}

async function fetchAi(onet) {
  if (!onet) return null
  try {
    const res = await aoiDsl(`GET AI_IMPACT FOR OCCUPATION WHERE ONET_CODE IS "${onet}"`)
    return res.data?.ai_impact || res.data || null
  } catch {
    return null
  }
}

function unwrapCount(res) {
  const d = res?.data
  if (!d) return d
  if (d.by_archetype || d.groups) return d
  if (d.data && (d.data.by_archetype || d.data.groups)) return d.data
  return d
}

async function badgeMatrix(clusterId) {
  try {
    const res = await aoiDsl(
      `COUNT OCCUPATION_BADGES WHERE CLUSTER_ID IS ${clusterId} GROUP BY ARCHETYPE`,
    )
    return unwrapCount(res)?.by_archetype || null
  } catch {
    return null
  }
}

async function industryGroups(clusterId) {
  try {
    const res = await aoiDsl(
      `COUNT OCCUPATION_BADGES WHERE CLUSTER_ID IS ${clusterId} GROUP BY INDUSTRY`,
    )
    const groups = unwrapCount(res)?.groups
    return Array.isArray(groups)
      ? groups
          .filter((g) => g.industry)
          .sort((a, b) => b.count - a.count)
      : []
  } catch {
    return []
  }
}

function sliceReport(report, atlas) {
  const metro = atlas?.metros?.find((m) => m.cbsa === report.place.cbsa)
  return {
    place: report.place,
    funnel: report.funnel,
    platinum: report.employers.filter((e) => e.badgeEarlyCareer === 'Platinum').length,
    core: report.employers.filter((e) => e.top10).length,
    employers: report.employers.slice(0, 7).map((e) => ({
      name: e.companyName,
      badge: e.badgeEarlyCareer,
      industry: e.primaryIndustry,
      top10: e.top10,
    })),
    groups: (report.groups || []).map((g) => ({
      name: g.displayName,
      promotion: g.promotion,
      door: g.door
        ? { heading: g.door.heading, barrier: g.door.barrier, premium: g.door.premium }
        : null,
    })),
    atlas: metro
      ? { employers: metro.employers, platinum: metro.platinum, short: metro.short }
      : null,
  }
}

/**
 * Option D — same major, two metros.
 */
export async function buildCompare({ cip, zipA, zipB }) {
  const [left, right, atlas] = await Promise.all([
    buildFieldReport({ cip, zip: zipA }),
    buildFieldReport({ cip, zip: zipB }),
    buildAtlas({ cip }).catch(() => null),
  ])
  return {
    cip: left.cip,
    left: sliceReport(left, atlas),
    right: sliceReport(right, atlas),
    coverage: {
      text: 'Each column is rated early-career employers in that metro for this major. Atlas counts (when present) scan 40 large metros; the named list is the live ZIP report.',
      source: SOURCE,
    },
    source: stamp(),
  }
}

function mapPathway(row) {
  return {
    clusterId: row.cluster_id,
    name: row.cluster_name,
    jobLevel: row.job_level || null,
    aiFlag: row.ai_flag || null,
    skills: [row.premium_skill_1, row.premium_skill_2, row.premium_skill_3].filter(Boolean),
    internalPct: pct(row.metrics?.internal_promotion_rate),
    externalPct: pct(row.metrics?.external_promotion_rate),
    retentionPct: pct(row.metrics?.retention_rate_3yr),
  }
}

async function listPath(kind, clusterId) {
  const cmd =
    kind === 'dest'
      ? `LIST DESTINATION_CLUSTERS FOR CLUSTER "${clusterId}" WHERE EXPERIENCE_LEVEL IS "Entry-Level" AND MSA_SIZE IS "Large" EXPAND NAMES`
      : `LIST SKILL_ADJACENT_CLUSTERS FOR CLUSTER "${clusterId}" WHERE EXPERIENCE_LEVEL IS "Entry-Level" AND MSA_SIZE IS "Large" EXPAND NAMES`
  try {
    const res = await aoiDsl(cmd)
    return (Array.isArray(res.data) ? res.data : []).map(mapPathway)
  } catch {
    return []
  }
}

/**
 * Option E — skill-adjacent + destination clusters.
 */
export async function buildPathways({ cip }) {
  const catalog = await loadCatalog()
  const major = catalog.majors.find((m) => m.cip === cip)
  const groups = await resolveDisplayGroups(cip, catalog)
  const rows = []
  for (const g of groups) {
    const clusterId = g.clusterIds[0]
    const [adjacent, destinations] = await Promise.all([
      listPath('adj', clusterId),
      listPath('dest', clusterId),
    ])
    rows.push({
      groupId: g.id,
      displayName: g.displayName,
      clusterId,
      adjacent,
      destinations,
    })
  }
  return {
    cip: { code: cip, title: major?.name || cip },
    groups: rows,
    coverage: {
      text: 'Adjacent clusters share a skill profile. Destinations are where people in this field commonly move next. Promotion split is field-level (entry, large metro), not company-level.',
      source: SOURCE,
    },
    source: stamp(),
  }
}

/**
 * Option F — WYWM 3×3 badge matrix for the primary cluster.
 */
export async function buildBadges({ cip }) {
  const catalog = await loadCatalog()
  const major = catalog.majors.find((m) => m.cip === cip)
  const groups = await resolveDisplayGroups(cip, catalog)
  const primary = groups[0]
  const clusterId = primary.clusterIds[0]

  const [matrix, industries, platinum] = await Promise.all([
    badgeMatrix(clusterId),
    industryGroups(clusterId),
    (async () => {
      try {
        const res = await aoiDsl(
          `LIST OCCUPATION_BADGES WHERE CLUSTER_ID IS ${clusterId} AND BADGE_EARLY_CAREER IS "Platinum" AND ENTRY_POSTING_TIER IS "high" LIMIT 12`,
        )
        return Array.isArray(res.data) ? res.data : []
      } catch {
        return []
      }
    })(),
  ])

  const groupMatrices = await Promise.all(
    groups.slice(1, 4).map(async (g) => ({
      name: g.displayName,
      clusterId: g.clusterIds[0],
      matrix: await badgeMatrix(g.clusterIds[0]),
    })),
  )

  return {
    cip: { code: cip, title: major?.name || cip },
    cluster: { id: clusterId, name: primary.displayName },
    matrix,
    groupMatrices,
    industries: industries.slice(0, 12),
    platinumHigh: platinum.map((r) => ({
      company: r.company_name,
      badgeGrowth: r.badge_growth,
      badgeStability: r.badge_stability,
      industry: r.industry || r.primary_industry || null,
    })),
    coverage: {
      text: 'Each cell is a company × occupation-cluster pair, not a unique company. Null/unranked pairs are coverage gaps, not low quality. Platinum + Gold = Ranked.',
      source: SOURCE,
    },
    source: stamp(),
  }
}

async function summarizeMajor(cip, catalog) {
  const major = catalog.majors.find((m) => m.cip === cip)
  const groups = await resolveDisplayGroups(cip, catalog)
  const primary = groups[0]
  const clusterId = primary.clusterIds[0]
  const onet = primary.primaryOnet || null

  const [segments, ai, matrix, industries, employers] = await Promise.all([
    fetchWages(onet),
    fetchAi(onet),
    badgeMatrix(clusterId),
    industryGroups(clusterId),
    (async () => {
      try {
        const res = await aoiDsl(
          `LIST COMPANIES FOR CLUSTER "${clusterId}" WHERE BADGE_EARLY_CAREER IS NOT NULL ORDER BY WYWM LIMIT 6`,
        )
        return Array.isArray(res.data) ? res.data : []
      } catch {
        return []
      }
    })(),
  ])

  const ranked = matrix?.early_career?.ranked ?? 0
  const topIndustry = industries[0] || null

  return {
    cip: { code: cip, title: major?.name || cip },
    cluster: { id: clusterId, name: primary.displayName },
    groups: groups.map((g) => g.displayName),
    wages: {
      entry: pickWage(segments, '0'),
      year5: pickWage(segments, '5'),
      year10: pickWage(segments, '10'),
    },
    ai: ai
      ? {
          flag: ai.ai_flag || null,
          barrier: ai.entry_barrier_trend || null,
          premium: ai.expertise_premium_trend || null,
        }
      : null,
    matrix,
    ratedPairs: ranked,
    topIndustry: topIndustry
      ? { name: topIndustry.industry, count: topIndustry.count }
      : null,
    employers: employers.map((e) => ({
      name: e.company_name,
      badge: e.badge_early_career,
      industry: e.primary_industry,
    })),
  }
}

/**
 * Option G — two majors, national AOI snapshot.
 */
export async function buildVersus({ cipA, cipB }) {
  const catalog = await loadCatalog()
  const [left, right] = await Promise.all([
    summarizeMajor(cipA, catalog),
    summarizeMajor(cipB, catalog),
  ])
  return {
    left,
    right,
    coverage: {
      text: 'National cluster snapshot, not a metro. Wages are occupation-level medians for large metros. Rated pairs are company × cluster rows with an early-career badge.',
      source: SOURCE,
    },
    source: stamp(),
  }
}

/**
 * Option H — which industries hire this major.
 */
export async function buildIndustries({ cip }) {
  const catalog = await loadCatalog()
  const major = catalog.majors.find((m) => m.cip === cip)
  const groups = await resolveDisplayGroups(cip, catalog)
  const primary = groups[0]
  const clusterId = primary.clusterIds[0]

  const [industries, platinumTech, matrix] = await Promise.all([
    industryGroups(clusterId),
    (async () => {
      try {
        const res = await aoiDsl(
          `LIST COMPANIES FOR CLUSTER "${clusterId}" WHERE BADGE_EARLY_CAREER IS "Platinum" ORDER BY WYWM LIMIT 15`,
        )
        return Array.isArray(res.data) ? res.data : []
      } catch {
        return []
      }
    })(),
    badgeMatrix(clusterId),
  ])

  const total = industries.reduce((s, g) => s + (g.count || 0), 0)
  const byIndustry = new Map()
  for (const e of platinumTech) {
    const key = e.primary_industry || 'Other'
    const list = byIndustry.get(key) || []
    list.push(e.company_name)
    byIndustry.set(key, list)
  }

  return {
    cip: { code: cip, title: major?.name || cip },
    cluster: { id: clusterId, name: primary.displayName },
    totalPairs: total,
    matrix,
    industries: industries.map((g) => ({
      name: g.industry,
      count: g.count,
      share: total ? g.count / total : 0,
      samples: (byIndustry.get(g.industry) || []).slice(0, 4),
    })),
    coverage: {
      text: 'Bars are company × occupation-cluster pairs in this field, grouped by the employer’s primary industry. Software majors often hire outside Software & Technology.',
      source: SOURCE,
    },
    source: stamp(),
  }
}
