import { aoiConfigured } from '../../server/aoiClient.mjs'
import { buildCompare } from '../../server/v4Extras.mjs'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, max-age=60')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!aoiConfigured()) {
    return res.status(503).json({ error: 'AOI credentials not configured.' })
  }
  try {
    res.status(200).json(
      await buildCompare({
        cip: String(req.query.cip || ''),
        zipA: String(req.query.zipA || ''),
        zipB: String(req.query.zipB || ''),
      }),
    )
  } catch (e) {
    res.status(e?.status || 500).json({
      error: e instanceof Error ? e.message : 'Failed to compare metros',
    })
  }
}
