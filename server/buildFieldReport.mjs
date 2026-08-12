/**
 * Dynamic Field Report builder: CIP + ZIP → AOI-backed FieldReport.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { aoiDsl } from './aoiClient.mjs'

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url))
/** Repo root locally; on Vercel NFT this is usually `/var/task`. */
const ROOT = path.resolve(MODULE_DIR, '..')
const DATA_CANDIDATES = [
  path.join(ROOT, 'public/data'),
  path.join(process.cwd(), 'public/data'),
  path.join(MODULE_DIR, '../public/data'),
]

async function resolveDataDir() {
  for (const dir of DATA_CANDIDATES) {
    try {
      await readFile(path.join(dir, 'majors.json'), 'utf8')
      return dir
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `Could not find public/data (tried: ${DATA_CANDIDATES.join(', ')})`,
  )
}

const BADGE_RANK = { Platinum: 2, Gold: 1 }

/** Spec §2.3 seeds — prefer these when CIP matches. */
const SEEDED_GROUPS = {
  '11.0701': [
    {
      id: 1,
      displayName: 'Software engineering',
      displayBlurb: 'Build products and systems in code.',
      clusterIds: [187, 891, 1001, 1000, 993, 103],
      vendorNames: ['Software Engineers'],
      primaryOnet: '15-1252.00',
    },
    {
      id: 2,
      displayName: 'Data and analytics',
      displayBlurb: 'Turn data into decisions and models.',
      clusterIds: [242, 118, 159, 243, 245],
      vendorNames: ['Data Scientists'],
      primaryOnet: '15-2051.00',
    },
    {
      id: 3,
      displayName: 'Security and infrastructure',
      displayBlurb: 'Keep systems running and safe.',
      clusterIds: [189, 190, 260, 718, 182, 183, 655, 191],
      vendorNames: ['IT Systems Analysts'],
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

/** Major metros for ZIP fallback via city/state match. */
const METROS = [
  { cbsa: '41860', cbsaName: 'San Francisco-Oakland-Berkeley, CA', msaSize: 'Large', seeds: ['94402'], match: [/san francisco|oakland|berkeley|san mateo|palo alto|san jose|sunnyvale|mountain view/i] },
  { cbsa: '35620', cbsaName: 'New York-Newark-Jersey City, NY-NJ-PA', msaSize: 'Large', seeds: ['10001'], match: [/new york|brooklyn|manhattan|newark|jersey city/i] },
  { cbsa: '42660', cbsaName: 'Seattle-Tacoma-Bellevue, WA', msaSize: 'Large', seeds: ['98101'], match: [/seattle|bellevue|tacoma|redmond/i] },
  { cbsa: '12420', cbsaName: 'Austin-Round Rock-Georgetown, TX', msaSize: 'Large', seeds: ['78701'], match: [/austin|round rock/i] },
  { cbsa: '16980', cbsaName: 'Chicago-Naperville-Elgin, IL-IN-WI', msaSize: 'Large', seeds: ['60601'], match: [/chicago|naperville|evanston/i] },
  { cbsa: '14460', cbsaName: 'Boston-Cambridge-Newton, MA-NH', msaSize: 'Large', seeds: ['02108'], match: [/boston|cambridge|somerville/i] },
  { cbsa: '12060', cbsaName: 'Atlanta-Sandy Springs-Alpharetta, GA', msaSize: 'Large', seeds: ['30301'], match: [/atlanta|sandy springs/i] },
  { cbsa: '19740', cbsaName: 'Denver-Aurora-Lakewood, CO', msaSize: 'Large', seeds: ['80202'], match: [/denver|aurora|boulder/i] },
  { cbsa: '31080', cbsaName: 'Los Angeles-Long Beach-Anaheim, CA', msaSize: 'Large', seeds: ['90012'], match: [/los angeles|long beach|anaheim|pasadena|santa monica/i] },
  { cbsa: '19100', cbsaName: 'Dallas-Fort Worth-Arlington, TX', msaSize: 'Large', seeds: ['75201'], match: [/dallas|fort worth|arlington|plano/i] },
  { cbsa: '26420', cbsaName: 'Houston-The Woodlands-Sugar Land, TX', msaSize: 'Large', seeds: ['77002'], match: [/houston|sugar land|the woodlands/i] },
  { cbsa: '37980', cbsaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', msaSize: 'Large', seeds: ['19103'], match: [/philadelphia|camden|wilmington/i] },
  { cbsa: '33100', cbsaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', msaSize: 'Large', seeds: ['33131'], match: [/miami|fort lauderdale|pompano/i] },
  { cbsa: '38060', cbsaName: 'Phoenix-Mesa-Chandler, AZ', msaSize: 'Large', seeds: ['85004'], match: [/phoenix|mesa|scottsdale|tempe/i] },
  { cbsa: '47900', cbsaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', msaSize: 'Large', seeds: ['20001'], match: [/washington|arlington|alexandria|dc\b/i] },
]

/** @type {Map<string, { at: number, report: object }>} */
const cache = new Map()
const CACHE_TTL_MS = 60 * 60 * 1000

let catalogPromise = null

async function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const DATA = await resolveDataDir()
      const [majors, occupations, crosswalk, placesFile] = await Promise.all([
        readFile(path.join(DATA, 'majors.json'), 'utf8').then(JSON.parse),
        readFile(path.join(DATA, 'occupations.json'), 'utf8').then(JSON.parse),
        readFile(path.join(DATA, 'crosswalk.json'), 'utf8').then(JSON.parse),
        readFile(path.join(DATA, 'v3/places.json'), 'utf8')
          .then(JSON.parse)
          .catch(() => ({ places: [] })),
      ])
      /** @type {Map<string, any>} */
      const occBySoc = new Map(occupations.map((o) => [o.soc, o]))
      return {
        majors,
        occupations,
        crosswalk,
        places: placesFile.places || [],
        occBySoc,
      }
    })()
  }
  return catalogPromise
}

function doorCopy(barrier, premium) {
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
  return (
    map[`${barrier}|${premium}`] || {
      heading: 'AI picture is mixed for this field',
      body: 'Trends split across roles in this group. Compare the employers still hiring early career.',
    }
  )
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

function intensityFromTier(row) {
  const tier = row.entry_posting_tier || row.total_posting_tier
  if (tier === 'high') return 2
  if (tier === 'above-average') return 1
  return 0
}

function humanizeClusterName(name) {
  if (!name) return 'Related roles'
  // Spec: avoid dumping raw verbose vendor titles when we can soften slightly
  return name.replace(/\s+[—–-]\s+.+$/, '').trim()
}

/**
 * @param {string} zip
 * @param {any[]} places
 */
async function resolvePlace(zip, places) {
  const seeded = places.find((p) => p.zip === zip)
  if (seeded) {
    return {
      zip,
      cbsa: seeded.cbsa,
      cbsaName: seeded.cbsaName,
      msaSize: seeded.msaSize || 'Large',
      scope: 'metro',
    }
  }

  // Zippopotam.us — city/state for metro match
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (res.ok) {
      const body = await res.json()
      const place = body.places?.[0]
      const city = place?.['place name'] || ''
      const state = place?.['state abbreviation'] || ''
      const hay = `${city} ${state}`
      for (const m of METROS) {
        if (m.match.some((re) => re.test(hay))) {
          return {
            zip,
            cbsa: m.cbsa,
            cbsaName: m.cbsaName,
            msaSize: m.msaSize,
            scope: 'metro',
            matchedCity: city,
          }
        }
      }
      return {
        zip,
        cbsa: null,
        cbsaName: city ? `${city}, ${state}` : `ZIP ${zip}`,
        msaSize: 'Large',
        scope: 'national',
        matchedCity: city,
        state,
      }
    }
  } catch {
    /* fall through */
  }

  return {
    zip,
    cbsa: null,
    cbsaName: `ZIP ${zip}`,
    msaSize: 'Large',
    scope: 'national',
  }
}

/**
 * Resolve CIP → up to 4 display groups with cluster ids via crosswalk + TITLECONVERT.
 */
async function resolveDisplayGroups(cip, catalog) {
  if (SEEDED_GROUPS[cip]) return SEEDED_GROUPS[cip]

  const entry = catalog.crosswalk[cip]
  if (!entry?.primary?.length) {
    throw Object.assign(new Error(`No CIP–SOC mapping for ${cip}`), { status: 404 })
  }

  const titles = []
  for (const soc of entry.primary.slice(0, 10)) {
    const occ = catalog.occBySoc.get(soc)
    if (occ?.title) titles.push(occ.title)
  }
  if (!titles.length) {
    throw Object.assign(new Error(`No occupation titles for ${cip}`), { status: 404 })
  }

  /** @type {Map<number, { clusterId: number, clusterName: string, onet: string, score: number }>} */
  const clusters = new Map()

  // Parallel TITLECONVERT (cap concurrency lightly)
  const chunk = titles.slice(0, 8)
  await Promise.all(
    chunk.map(async (title) => {
      try {
        const res = await aoiDsl(`TITLECONVERT "${title.replace(/"/g, '')}" EXPAND CLUSTER`)
        const rows = Array.isArray(res.data) ? res.data : []
        // Prefer the recommended (first) match only — fan-out creates noisy groups.
        const row = rows[0]
        if (!row?.cluster_id) return
        const score = Number(row.match_score) || 0
        const prev = clusters.get(row.cluster_id)
        if (!prev || score > prev.score) {
          clusters.set(row.cluster_id, {
            clusterId: row.cluster_id,
            clusterName: row.cluster_name || title,
            onet: row.onet_code,
            score,
          })
        }
      } catch {
        /* skip title */
      }
    }),
  )

  let ranked = [...clusters.values()].sort((a, b) => b.score - a.score)

  // If too many, keep top 4 by match score (employer ranking happens later per group)
  if (ranked.length > 4) ranked = ranked.slice(0, 4)
  if (!ranked.length) {
    throw Object.assign(new Error(`Could not resolve occupation clusters for ${cip}`), {
      status: 502,
    })
  }

  return ranked.map((c, i) => ({
    id: i + 1,
    displayName: humanizeClusterName(c.clusterName),
    displayBlurb: `Roles related to ${c.clusterName}.`,
    clusterIds: [c.clusterId],
    vendorNames: [c.clusterName],
    primaryOnet: c.onet || null,
  }))
}

async function fetchEmployers(clusterId, place) {
  const cbsaClause =
    place.scope === 'metro' && place.cbsa
      ? ` WHERE CBSA IS "${place.cbsa}" AND BADGE_EARLY_CAREER IS NOT NULL`
      : ` WHERE BADGE_EARLY_CAREER IS NOT NULL`
  const q = `LIST COMPANIES FOR CLUSTER "${clusterId}"${cbsaClause} ORDER BY WYWM LIMIT 100`
  try {
    const res = await aoiDsl(q)
    return Array.isArray(res.data) ? res.data : []
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

async function fetchDestinations(clusterId, msaSize) {
  try {
    const res = await aoiDsl(
      `LIST DESTINATION_CLUSTERS FOR CLUSTER "${clusterId}" WHERE EXPERIENCE_LEVEL IS "Entry-Level" AND MSA_SIZE IS "${msaSize}" EXPAND NAMES`,
    )
    return Array.isArray(res.data) ? res.data : []
  } catch {
    return []
  }
}

function dedupeEmployers(rows) {
  /** @type {Map<string, any>} */
  const byName = new Map()
  for (const row of rows) {
    const name = row.company_name
    if (!name || !row.badge_early_career) continue
    const intensity = intensityFromTier(row)
    if (intensity < 1) continue
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
        top10:
          row.top10_occupation === '1' ||
          row.top10_occupation === 1 ||
          row.top10_occupation === 'Yes',
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

/**
 * @param {{ cip: string, zip: string }} args
 */
export async function buildFieldReport({ cip, zip }) {
  if (!/^\d{2}\.\d{4}$/.test(cip)) {
    throw Object.assign(new Error('Invalid CIP'), { status: 400 })
  }
  if (!/^\d{5}$/.test(zip)) {
    throw Object.assign(new Error('Invalid ZIP'), { status: 400 })
  }

  const catalog = await loadCatalog()
  const major = catalog.majors.find((m) => m.cip === cip)
  const place = await resolvePlace(zip, catalog.places)

  const cacheKey = `${cip}|${place.cbsa || 'national'}|${place.scope}`
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    // Re-stamp zip on cached metro report
    return {
      ...hit.report,
      place: { ...hit.report.place, zip },
      cached: true,
    }
  }

  const groupsDef = await resolveDisplayGroups(cip, catalog)

  let totalRated = 0
  try {
    const counted = await aoiDsl('COUNT COMPANIES WHERE OVERALL_BADGE IS NOT NULL')
    totalRated = counted.data?.count ?? counted.count ?? 0
  } catch {
    totalRated = 0
  }

  const employerRows = []
  const groups = []

  for (const g of groupsDef) {
    const primaryCluster = g.clusterIds[0]
    const rows = await fetchEmployers(primaryCluster, place)
    for (const r of rows) employerRows.push({ ...r, _groupId: g.id })

    const [ai, dests] = await Promise.all([
      fetchAi(g.primaryOnet),
      fetchDestinations(primaryCluster, place.msaSize || 'Large'),
    ])

    const metrics = dests.map((d) => d.metrics).filter(Boolean)
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
            methodologyVersion:
              ai?.coverage?.methodology_version || ai?.methodology_version || null,
            ...copy,
          }
        : null,
    })
  }

  const employers = dedupeEmployers(employerRows)

  // Approximate rated-in-field: unique employers we saw across national queries for primary clusters
  // Prefer distinct company names from a wider pull when metro list is thin
  let ratedInField = employers.length
  if (place.scope === 'metro') {
    const names = new Set()
    for (const g of groupsDef.slice(0, 3)) {
      const national = await fetchEmployers(g.clusterIds[0], {
        scope: 'national',
        cbsa: null,
        msaSize: 'Large',
      })
      for (const r of national) {
        if (r.company_name && r.badge_early_career) names.add(r.company_name)
      }
    }
    ratedInField = Math.max(names.size, employers.length)
  }

  const report = {
    cip: { code: cip, title: major?.name || cip },
    place: {
      zip,
      cbsa: place.cbsa || 'national',
      cbsaName:
        place.scope === 'national'
          ? `${place.cbsaName} (nationwide employers — ZIP not in a mapped metro)`
          : place.cbsaName,
      msaSize: place.msaSize || 'Large',
      scope: place.scope,
    },
    funnel: {
      totalRated,
      ratedInField,
      hiringHere: employers.length,
    },
    groups,
    employers,
    destinations: groups.flatMap((g) =>
      (g.destinations || []).map((d) => ({
        ...d,
        fromGroupId: g.id,
        fromGroupName: g.displayName,
      })),
    ),
    door: groups.map((g) => ({
      groupId: g.id,
      groupName: g.displayName,
      ...(g.door || {}),
    })),
    metros: METROS.map((m) => ({
      zip: m.seeds[0],
      cbsa: m.cbsa,
      cbsaName: m.cbsaName,
      employersHiring: m.cbsa === place.cbsa ? employers.length : 0,
      isCurrent: m.cbsa === place.cbsa,
      score: m.cbsa === place.cbsa ? Math.log1p(employers.length) : 0,
    })).sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || b.score - a.score),
    coverage: {
      text: 'This list covers companies rated for early-career hiring. A company not shown here has not been rated, which is not a judgment about it.',
    },
    radiusExpanded: false,
    source: {
      provider: 'AOI / WYWM (aonav.ai) live',
      builtAt: new Date().toISOString(),
      dynamic: true,
    },
  }

  cache.set(cacheKey, { at: Date.now(), report })
  return report
}
