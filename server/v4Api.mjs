import { aoiConfigured } from '../server/aoiClient.mjs'
import { buildAtlas } from '../server/buildAtlas.mjs'
import { buildFootprint } from '../server/buildFootprint.mjs'
import { buildV4Report } from '../server/buildV4Report.mjs'
import {
  buildBadges,
  buildCompare,
  buildIndustries,
  buildPathways,
  buildVersus,
} from '../server/v4Extras.mjs'

function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'private, max-age=60')
  res.statusCode = status
  res.end(JSON.stringify(body))
}

function requireAoi(res) {
  if (aoiConfigured()) return true
  json(res, 503, {
    error:
      'AOI credentials not configured. Set AOI_USERNAME and AOI_PASSWORD in the server environment.',
  })
  return false
}

function parseUrl(req) {
  return new URL(req.url || '', 'http://localhost')
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function handleV4Atlas(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }
  if (!requireAoi(res)) return
  try {
    const cip = String(parseUrl(req).searchParams.get('cip') || '')
    const atlas = await buildAtlas({ cip })
    const client = {
      ...atlas,
      metros: atlas.metros.map(({ employerNames: _names, ...m }) => m),
    }
    json(res, 200, client)
  } catch (e) {
    json(res, e?.status || 500, {
      error: e instanceof Error ? e.message : 'Failed to build atlas',
    })
  }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function handleV4Report(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }
  if (!requireAoi(res)) return
  try {
    const url = parseUrl(req)
    const cip = String(url.searchParams.get('cip') || '')
    const zip = String(url.searchParams.get('zip') || '')
    const report = await buildV4Report({ cip, zip })
    json(res, 200, report)
  } catch (e) {
    json(res, e?.status || 500, {
      error: e instanceof Error ? e.message : 'Failed to build report',
    })
  }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function handleV4Footprint(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }
  if (!requireAoi(res)) return
  try {
    const url = parseUrl(req)
    const cip = String(url.searchParams.get('cip') || '')
    const company = String(url.searchParams.get('company') || '')
    const footprint = await buildFootprint({ cip, company })
    json(res, 200, footprint)
  } catch (e) {
    json(res, e?.status || 500, {
      error: e instanceof Error ? e.message : 'Failed to build footprint',
    })
  }
}

function requireCip(value) {
  if (!/^\d{2}\.\d{4}$/.test(String(value || ''))) {
    throw Object.assign(new Error('Invalid CIP'), { status: 400 })
  }
  return String(value)
}

function requireZip(value) {
  if (!/^\d{5}$/.test(String(value || ''))) {
    throw Object.assign(new Error('Invalid ZIP'), { status: 400 })
  }
  return String(value)
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function handleV4Compare(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }
  if (!requireAoi(res)) return
  try {
    const url = parseUrl(req)
    const payload = await buildCompare({
      cip: requireCip(url.searchParams.get('cip')),
      zipA: requireZip(url.searchParams.get('zipA')),
      zipB: requireZip(url.searchParams.get('zipB')),
    })
    json(res, 200, payload)
  } catch (e) {
    json(res, e?.status || 500, {
      error: e instanceof Error ? e.message : 'Failed to compare metros',
    })
  }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function handleV4Pathways(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }
  if (!requireAoi(res)) return
  try {
    const cip = requireCip(parseUrl(req).searchParams.get('cip'))
    json(res, 200, await buildPathways({ cip }))
  } catch (e) {
    json(res, e?.status || 500, {
      error: e instanceof Error ? e.message : 'Failed to build pathways',
    })
  }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function handleV4Badges(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }
  if (!requireAoi(res)) return
  try {
    const cip = requireCip(parseUrl(req).searchParams.get('cip'))
    json(res, 200, await buildBadges({ cip }))
  } catch (e) {
    json(res, e?.status || 500, {
      error: e instanceof Error ? e.message : 'Failed to build badges',
    })
  }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function handleV4Versus(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }
  if (!requireAoi(res)) return
  try {
    const url = parseUrl(req)
    json(
      res,
      200,
      await buildVersus({
        cipA: requireCip(url.searchParams.get('a')),
        cipB: requireCip(url.searchParams.get('b')),
      }),
    )
  } catch (e) {
    json(res, e?.status || 500, {
      error: e instanceof Error ? e.message : 'Failed to compare majors',
    })
  }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function handleV4Industries(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' })
    return
  }
  if (!requireAoi(res)) return
  try {
    const cip = requireCip(parseUrl(req).searchParams.get('cip'))
    json(res, 200, await buildIndustries({ cip }))
  } catch (e) {
    json(res, e?.status || 500, {
      error: e instanceof Error ? e.message : 'Failed to build industry mix',
    })
  }
}

const ROUTES = [
  ['/api/v4/atlas', handleV4Atlas],
  ['/api/v4/report', handleV4Report],
  ['/api/v4/footprint', handleV4Footprint],
  ['/api/v4/compare', handleV4Compare],
  ['/api/v4/pathways', handleV4Pathways],
  ['/api/v4/badges', handleV4Badges],
  ['/api/v4/versus', handleV4Versus],
  ['/api/v4/industries', handleV4Industries],
]

/** Vite plugin — serves /api/v4/* in local dev. */
export function v4ApiPlugin() {
  return {
    name: 'field-report-v4-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        const hit = ROUTES.find(([path]) => url.startsWith(path))
        if (!hit) return next()
        try {
          await hit[1](req, res)
        } catch (e) {
          json(res, 500, { error: e instanceof Error ? e.message : 'error' })
        }
      })
    },
  }
}
