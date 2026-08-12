/**
 * Build Field Report v3 fixtures from AOI (aonav.ai).
 *
 * Requires AOI_USERNAME / AOI_PASSWORD in the environment.
 * Usage: node scripts/build-v3-aoi.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/data/v3')
const BASE = process.env.AOI_BASE_URL || 'https://aonav.ai'
const USER = process.env.AOI_USERNAME
const PASS = process.env.AOI_PASSWORD

if (!USER || !PASS) {
  console.error('Set AOI_USERNAME and AOI_PASSWORD')
  process.exit(1)
}

/** Spec §2.3 seed for CIP 11.0701 */
const DISPLAY_GROUPS = {
  '11.0701': [
    {
      id: 1,
      displayName: 'Software engineering',
      displayBlurb: 'Build products and systems in code.',
      clusterIds: [187, 891, 1001, 1000, 993, 103],
      vendorNames: ['Software Engineers', 'Software Quality Assurance Analysts and Testers'],
      primaryOnet: '15-1252.00',
    },
    {
      id: 2,
      displayName: 'Data and analytics',
      displayBlurb: 'Turn data into decisions and models.',
      clusterIds: [242, 118, 159, 243, 245],
      vendorNames: ['Data Scientists', 'Database Architects', 'Database Management Professionals'],
      primaryOnet: '15-2051.00',
    },
    {
      id: 3,
      displayName: 'Security and infrastructure',
      displayBlurb: 'Keep systems running and safe.',
      clusterIds: [189, 190, 260, 718, 182, 183, 655, 191],
      vendorNames: ['IT Systems Analysts', 'Computer Systems & Security Engineers'],
      primaryOnet: '15-1212.00',
    },
    {
      id: 4,
      displayName: 'Technical management and specialist',
      displayBlurb: 'Lead projects and deep specialist tracks.',
      clusterIds: [193, 510, 192, 186, 266, 440, 457],
      vendorNames: ['Information Technology Project Managers'],
      primaryOnet: '15-1299.09',
    },
  ],
}

const PLACES = [
  { zip: '94402', cbsa: '41860', cbsaName: 'San Francisco-Oakland-Berkeley, CA', msaSize: 'Large', seed: true },
  { zip: '10001', cbsa: '35620', cbsaName: 'New York-Newark-Jersey City, NY-NJ-PA', msaSize: 'Large', seed: true },
  { zip: '98101', cbsa: '42660', cbsaName: 'Seattle-Tacoma-Bellevue, WA', msaSize: 'Large', seed: true },
  { zip: '78701', cbsa: '12420', cbsaName: 'Austin-Round Rock-Georgetown, TX', msaSize: 'Large', seed: true },
  { zip: '60601', cbsa: '16980', cbsaName: 'Chicago-Naperville-Elgin, IL-IN-WI', msaSize: 'Large', seed: true },
  { zip: '02108', cbsa: '14460', cbsaName: 'Boston-Cambridge-Newton, MA-NH', msaSize: 'Large', seed: true },
  { zip: '30301', cbsa: '12060', cbsaName: 'Atlanta-Sandy Springs-Alpharetta, GA', msaSize: 'Large', seed: true },
  { zip: '80202', cbsa: '19740', cbsaName: 'Denver-Aurora-Lakewood, CO', msaSize: 'Large', seed: true },
]

const BADGE_RANK = { Platinum: 2, Gold: 1 }

let token = null

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  })
  const body = await res.json()
  if (!body?.tokens?.access_token) throw new Error(`login failed: ${JSON.stringify(body).slice(0, 200)}`)
  token = body.tokens.access_token
}

async function dsl(query) {
  const res = await fetch(`${BASE}/api/dsl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  })
  const body = await res.json()
  if (!res.ok || body?.success === false) {
    throw new Error(`DSL failed for ${query}: ${JSON.stringify(body).slice(0, 400)}`)
  }
  // AOI wraps as { success, data: { status, data, count, command } }
  const inner = body.data
  if (inner && typeof inner === 'object' && ('data' in inner || 'count' in inner)) {
    return {
      success: true,
      data: inner.data,
      count: inner.count ?? (Array.isArray(inner.data) ? inner.data.length : undefined),
      command: inner.command,
    }
  }
  return body
}

/** Prefer /api/dsl; fall back to MCP HTTP tools/call. */
async function queryAoi(q) {
  try {
    return await dsl(q)
  } catch {
    // MCP path
    const initHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${token}`,
    }
    const initRes = await fetch(`${BASE}/mcp`, {
      method: 'POST',
      headers: initHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'fieldreport-v3-build', version: '1' },
        },
      }),
    })
    const sid = initRes.headers.get('mcp-session-id')
    await initRes.text()
    await fetch(`${BASE}/mcp`, {
      method: 'POST',
      headers: { ...initHeaders, ...(sid ? { 'Mcp-Session-Id': sid } : {}) },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    })
    const callRes = await fetch(`${BASE}/mcp`, {
      method: 'POST',
      headers: { ...initHeaders, ...(sid ? { 'Mcp-Session-Id': sid } : {}) },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'aoi_dsl_query', arguments: { query: q } },
      }),
    })
    const callBody = await callRes.json()
    const text = callBody?.result?.content?.[0]?.text
    if (!text) throw new Error(`MCP call failed: ${JSON.stringify(callBody).slice(0, 400)}`)
    let parsed = JSON.parse(text)
    // Nested AOI wrap
    if (parsed?.content?.[0]?.text) {
      parsed = JSON.parse(parsed.content[0].text)
    }
    return parsed
  }
}

function intensityFromTier(row) {
  const tier = row.entry_posting_tier || row.total_posting_tier
  if (tier === 'high') return 2
  if (tier === 'above-average') return 1
  return 0
}

function doorCopy(barrier, premium) {
  const key = `${barrier}|${premium}`
  const map = {
    'Rising|Rising': {
      heading: 'Harder to get in, better once you are',
      body: 'Fewer employers are opening junior roles. The ones below are the ones that still are.',
    },
    'Falling|Rising': {
      heading: 'Open door, rising ceiling',
      body: 'Entry is getting easier and experience still pays. Best odds of the four.',
    },
    'Rising|Falling': {
      heading: 'Narrow door, flat ceiling',
      body: 'Harder to enter and the pay premium for experience is shrinking. Worth comparing against your other groups.',
    },
    'Falling|Falling': {
      heading: 'Open door, flat ceiling',
      body: 'Easy to enter, less reward for staying. Plan the next move early.',
    },
  }
  return map[key] || {
    heading: 'AI picture is mixed for this field',
    body: 'Trends split across roles in this group. Compare the employers still hiring early career.',
  }
}

function promotionLine(internal, external) {
  const i = Math.round(internal * 100)
  const e = Math.round(external * 100)
  const diff = i - e
  let verdict
  if (diff >= 5) verdict = 'Most people who move up here do it without changing employer.'
  else if (diff <= -5) verdict = 'More people move up by leaving than by staying.'
  else verdict = 'Moving up and moving on are about equally common.'
  return { internalPct: i, externalPct: e, verdict }
}

async function fetchEmployersForCluster(clusterId, cbsa) {
  const q = `LIST COMPANIES FOR CLUSTER "${clusterId}" WHERE CBSA IS "${cbsa}" AND BADGE_EARLY_CAREER IS NOT NULL ORDER BY WYWM LIMIT 100`
  const res = await queryAoi(q)
  return Array.isArray(res.data) ? res.data : []
}

async function fetchAi(onet) {
  try {
    const res = await queryAoi(`GET AI_IMPACT FOR OCCUPATION WHERE ONET_CODE IS "${onet}"`)
    return res.data?.ai_impact || res.data || null
  } catch {
    return null
  }
}

async function fetchDestinations(clusterId, msaSize) {
  try {
    const res = await queryAoi(
      `LIST DESTINATION_CLUSTERS FOR CLUSTER "${clusterId}" WHERE EXPERIENCE_LEVEL IS "Entry-Level" AND MSA_SIZE IS "${msaSize}" EXPAND NAMES`,
    )
    return Array.isArray(res.data) ? res.data : []
  } catch {
    return []
  }
}

async function countRated() {
  const res = await queryAoi('COUNT COMPANIES WHERE OVERALL_BADGE IS NOT NULL')
  return res.data?.count ?? res.count ?? 0
}

async function countRatedInClusters(clusterIds) {
  const names = new Set()
  for (const id of clusterIds.slice(0, 6)) {
    const res = await queryAoi(
      `LIST COMPANIES FOR CLUSTER "${id}" WHERE BADGE_EARLY_CAREER IS NOT NULL LIMIT 1000`,
    )
    const rows = Array.isArray(res.data) ? res.data : []
    for (const row of rows) {
      if (row.company_name) names.add(row.company_name)
    }
  }
  return names.size
}

function dedupeEmployers(rows) {
  /** @type {Map<string, any>} */
  const byName = new Map()
  for (const row of rows) {
    const name = row.company_name
    if (!name) continue
    const intensity = intensityFromTier(row)
    if (intensity < 1) continue
    if (!row.badge_early_career) continue
    const groupId = row._groupId
    const existing = byName.get(name)
    if (!existing) {
      byName.set(name, {
        companyUid: row.company_uid || name,
        companyName: name,
        companyUrl: row.company_URL || row.company_url || null,
        primaryIndustry: row.primary_industry || null,
        badgeEarlyCareer: row.badge_early_career,
        badgeGrowth: row.badge_growth || null,
        hiringIntensity: intensity,
        top10: row.top10_occupation === '1' || row.top10_occupation === 1 || row.top10_occupation === 'Yes',
        groupIds: groupId ? [groupId] : [],
        entryPostingTier: row.entry_posting_tier,
        metroLabel: row._metroLabel || null,
      })
      continue
    }
    existing.hiringIntensity = Math.max(existing.hiringIntensity, intensity)
    if ((BADGE_RANK[row.badge_early_career] || 0) > (BADGE_RANK[existing.badgeEarlyCareer] || 0)) {
      existing.badgeEarlyCareer = row.badge_early_career
    }
    if (row.top10_occupation === '1' || row.top10_occupation === 1) existing.top10 = true
    if (groupId && !existing.groupIds.includes(groupId)) existing.groupIds.push(groupId)
  }

  return [...byName.values()].sort((a, b) => {
    if (b.hiringIntensity !== a.hiringIntensity) return b.hiringIntensity - a.hiringIntensity
    if ((BADGE_RANK[b.badgeEarlyCareer] || 0) !== (BADGE_RANK[a.badgeEarlyCareer] || 0)) {
      return (BADGE_RANK[b.badgeEarlyCareer] || 0) - (BADGE_RANK[a.badgeEarlyCareer] || 0)
    }
    if (Number(b.top10) !== Number(a.top10)) return Number(b.top10) - Number(a.top10)
    if (b.groupIds.length !== a.groupIds.length) return b.groupIds.length - a.groupIds.length
    return a.companyName.localeCompare(b.companyName)
  })
}

async function buildReport(cip, place) {
  const groupsDef = DISPLAY_GROUPS[cip]
  if (!groupsDef) throw new Error(`No display groups for ${cip}`)

  const allClusterIds = groupsDef.flatMap((g) => g.clusterIds)
  const [totalRated, ratedInField] = await Promise.all([
    countRated(),
    countRatedInClusters(allClusterIds),
  ])

  const employerRows = []
  const groups = []

  for (const g of groupsDef) {
    const primaryCluster = g.clusterIds[0]
    const rows = await fetchEmployersForCluster(primaryCluster, place.cbsa)
    for (const r of rows) {
      employerRows.push({ ...r, _groupId: g.id })
    }

    const [ai, dests] = await Promise.all([
      fetchAi(g.primaryOnet),
      fetchDestinations(primaryCluster, place.msaSize),
    ])

    const metrics = dests
      .map((d) => d.metrics)
      .filter(Boolean)
    const avgInternal =
      metrics.length > 0
        ? metrics.reduce((s, m) => s + (m.internal_promotion_rate || 0), 0) / metrics.length
        : null
    const avgExternal =
      metrics.length > 0
        ? metrics.reduce((s, m) => s + (m.external_promotion_rate || 0), 0) / metrics.length
        : null

    const barrier = ai?.entry_barrier_trend || null
    const premium = ai?.expertise_premium_trend || null
    const copy = barrier && premium ? doorCopy(barrier, premium) : null

    groups.push({
      id: g.id,
      displayName: g.displayName,
      displayBlurb: g.displayBlurb,
      clusterIds: g.clusterIds,
      vendorNames: g.vendorNames,
      destinations: dests
        .filter((d) => !g.clusterIds.includes(d.cluster_id))
        .slice(0, 3)
        .map((d) => ({
          clusterId: d.cluster_id,
          name: d.cluster_name,
          jobLevel: d.job_level,
        })),
      promotion:
        avgInternal != null && avgExternal != null
          ? promotionLine(avgInternal, avgExternal)
          : null,
      door: copy
        ? {
            barrier,
            premium,
            aiFlag: ai?.ai_flag || null,
            methodologyVersion: ai?.coverage?.methodology_version || ai?.methodology_version || null,
            ...copy,
          }
        : null,
    })
  }

  const employers = dedupeEmployers(employerRows)

  return {
    cip: { code: cip, title: cip === '11.0701' ? 'Computer Science' : cip },
    place: {
      zip: place.zip,
      cbsa: place.cbsa,
      cbsaName: place.cbsaName,
      msaSize: place.msaSize,
    },
    funnel: {
      totalRated,
      ratedInField,
      hiringHere: employers.length,
    },
    groups,
    employers,
    destinations: groups.flatMap((g) =>
      (g.destinations || []).map((d) => ({ ...d, fromGroupId: g.id, fromGroupName: g.displayName })),
    ),
    door: groups.map((g) => ({ groupId: g.id, groupName: g.displayName, ...(g.door || {}) })),
    metros: [], // filled after multi-metro build
    coverage: {
      text: 'This list covers companies rated for early-career hiring. A company not shown here has not been rated, which is not a judgment about it.',
    },
    radiusExpanded: false,
    source: {
      provider: 'AOI / WYWM (aonav.ai)',
      builtAt: new Date().toISOString(),
    },
  }
}

async function main() {
  await login()
  await mkdir(OUT, { recursive: true })
  await mkdir(path.join(OUT, 'reports'), { recursive: true })

  await writeFile(path.join(OUT, 'places.json'), JSON.stringify({ places: PLACES }, null, 2))
  await writeFile(
    path.join(OUT, 'supported-cips.json'),
    JSON.stringify(
      {
        cips: Object.keys(DISPLAY_GROUPS).map((code) => ({
          code,
          title: code === '11.0701' ? 'Computer Science' : code,
          groups: DISPLAY_GROUPS[code].map((g) => ({
            id: g.id,
            displayName: g.displayName,
            displayBlurb: g.displayBlurb,
            clusterIds: g.clusterIds,
          })),
        })),
      },
      null,
      2,
    ),
  )

  const cip = '11.0701'
  /** @type {Map<string, any>} */
  const byCbsa = new Map()

  for (const place of PLACES) {
    console.log(`Building ${cip} @ ${place.zip} (${place.cbsaName})…`)
    const report = await buildReport(cip, place)
    byCbsa.set(place.cbsa, report)
    const key = `${cip}-${place.cbsa}`
    await writeFile(path.join(OUT, 'reports', `${key}.json`), JSON.stringify(report, null, 2))
    console.log(`  → ${report.employers.length} employers, funnel ${report.funnel.hiringHere}`)
  }

  // Attach metro comparison (employer density only — no OEWS/RPP in this build)
  for (const place of PLACES) {
    const key = `${cip}-${place.cbsa}`
    const report = byCbsa.get(place.cbsa)
    report.metros = PLACES.map((p) => {
      const other = byCbsa.get(p.cbsa)
      const density = other?.funnel.hiringHere || 0
      return {
        zip: p.zip,
        cbsa: p.cbsa,
        cbsaName: p.cbsaName,
        employersHiring: density,
        isCurrent: p.cbsa === place.cbsa,
        score: Math.log1p(density),
      }
    }).sort((a, b) => b.score - a.score)
    // Keep current metro even if last
    if (!report.metros.some((m) => m.isCurrent)) {
      /* impossible */
    }
    await writeFile(path.join(OUT, 'reports', `${key}.json`), JSON.stringify(report, null, 2))
  }

  // Index for the client
  await writeFile(
    path.join(OUT, 'index.json'),
    JSON.stringify(
      {
        reports: PLACES.map((p) => ({
          cip,
          zip: p.zip,
          cbsa: p.cbsa,
          path: `reports/${cip}-${p.cbsa}.json`,
        })),
      },
      null,
      2,
    ),
  )

  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
