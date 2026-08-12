import { aoiConfigured } from '../server/aoiClient.mjs'
import { buildFieldReport } from '../server/buildFieldReport.mjs'

/**
 * Shared handler for GET /api/v3/report?cip=&zip=
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function handleV3Report(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'private, max-age=60')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  if (!aoiConfigured()) {
    res.statusCode = 503
    res.end(
      JSON.stringify({
        error:
          'AOI credentials not configured. Set AOI_USERNAME and AOI_PASSWORD in the server environment.',
      }),
    )
    return
  }

  try {
    const url = new URL(req.url || '', 'http://localhost')
    const cip = String(url.searchParams.get('cip') || '')
    const zip = String(url.searchParams.get('zip') || '')
    const report = await buildFieldReport({ cip, zip })
    res.statusCode = 200
    res.end(JSON.stringify(report))
  } catch (e) {
    const status = e?.status || 500
    res.statusCode = status
    res.end(
      JSON.stringify({
        error: e instanceof Error ? e.message : 'Failed to build report',
      }),
    )
  }
}

/** Vite plugin — serves /api/v3/report in local dev. */
export function v3ApiPlugin() {
  return {
    name: 'field-report-v3-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/v3/report')) return next()
        try {
          await handleV3Report(req, res)
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'error' }))
        }
      })
    },
  }
}
