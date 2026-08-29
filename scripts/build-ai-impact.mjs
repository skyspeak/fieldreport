/**
 * Aggregate AOI Gen-3 AI-impact flags to 6-digit SOC for Field Report Phase 1.
 *
 * Requires AOI_USERNAME / AOI_PASSWORD in the environment.
 * Usage: node scripts/build-ai-impact.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/data/ai-impact.json')
const OCC = path.join(ROOT, 'public/data/occupations.json')
const BASE = process.env.AOI_BASE_URL || 'https://aonav.ai'
const USER = process.env.AOI_USERNAME
const PASS = process.env.AOI_PASSWORD

const FLAG_BARRIER = {
  'Raising the Bar': 'Rising',
  'Shrinking Fields': 'Rising',
  'Winners Pull Away': 'Falling',
  'Lower Potential': 'Falling',
}

if (!USER || !PASS) {
  console.error('Set AOI_USERNAME and AOI_PASSWORD')
  process.exit(1)
}

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  })
  const body = await res.json()
  if (!body?.tokens?.access_token) {
    throw new Error(`login failed: ${JSON.stringify(body).slice(0, 200)}`)
  }
  return body.tokens.access_token
}

async function dsl(token, query) {
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
  const inner = body.data
  if (inner && typeof inner === 'object' && ('data' in inner || 'count' in inner)) {
    return inner.data
  }
  return body.data
}

function pickRow(hits) {
  const exact = hits.filter((h) => h.onet.endsWith('.00'))
  const pool = exact.length ? exact : hits
  const counts = new Map()
  for (const h of pool) counts.set(h.flag, (counts.get(h.flag) || 0) + 1)
  let best = pool[0].flag
  let n = 0
  for (const [flag, c] of counts) {
    if (c > n) {
      best = flag
      n = c
    }
  }
  return pool.find((h) => h.flag === best) || pool[0]
}

const token = await login()
const rows = await dsl(
  token,
  'LIST OCCUPATIONS WHERE AI_FLAG IS NOT NULL EXPAND AI_IMPACT LIMIT 300',
)
if (!Array.isArray(rows)) {
  throw new Error('Expected occupation list from AOI')
}

const bySocHits = new Map()
for (const r of rows) {
  const onet = r.onet_code
  if (!onet) continue
  const soc = String(onet).split('.')[0]
  const impact = r.ai_impact || {}
  const flag = r.ai_flag || impact.ai_flag
  if (!flag) continue
  const barrier = impact.entry_barrier_trend || FLAG_BARRIER[flag]
  if (!barrier) continue
  const list = bySocHits.get(soc) || []
  list.push({
    onet,
    flag,
    barrier,
    premium: impact.expertise_premium_trend || null,
    clusterId: r.cluster_id ?? null,
  })
  bySocHits.set(soc, list)
}

const occupations = JSON.parse(await readFile(OCC, 'utf8'))
const bySoc = {}
for (const soc of [...bySocHits.keys()].sort()) {
  const chosen = pickRow(bySocHits.get(soc))
  bySoc[soc] = {
    soc,
    barrier: chosen.barrier,
    flag: chosen.flag,
    premium: chosen.premium,
    clusterId: chosen.clusterId,
  }
}

const matched = occupations.filter((o) => bySoc[o.soc]).length
const out = {
  source:
    'American Opportunity Index, Schultz Family Foundation, via AOI / Where You Work Matters',
  methodologyVersion: '2026-04-21',
  generatedAt: new Date().toISOString(),
  aggregation: 'O*NET to 6-digit SOC: prefer *.00, else modal AI flag',
  coverage: {
    occupations: occupations.length,
    matched,
    onetRows: rows.length,
    socs: Object.keys(bySoc).length,
  },
  bySoc,
}

await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`)
console.log(
  `Wrote ${OUT} (${Object.keys(bySoc).length} SOCs, ${matched}/${occupations.length} occupations)`,
)
