import { aoiConfigured } from '../server/aoiClient.mjs'
import { buildFieldReport } from '../server/buildFieldReport.mjs'

/**
 * Vercel serverless: GET /api/v3/report?cip=&zip=
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, max-age=60')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!aoiConfigured()) {
    res.status(503).json({
      error:
        'AOI credentials not configured. Set AOI_USERNAME and AOI_PASSWORD in the Vercel project.',
    })
    return
  }

  try {
    const cip = String(req.query.cip || '')
    const zip = String(req.query.zip || '')
    const report = await buildFieldReport({ cip, zip })
    res.status(200).json(report)
  } catch (e) {
    const status = e?.status || 500
    res.status(status).json({
      error: e instanceof Error ? e.message : 'Failed to build report',
    })
  }
}
