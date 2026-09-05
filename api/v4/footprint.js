import { aoiConfigured } from '../../server/aoiClient.mjs'
import { buildFootprint } from '../../server/buildFootprint.mjs'

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
      error: 'AOI credentials not configured. Set AOI_USERNAME and AOI_PASSWORD.',
    })
    return
  }
  try {
    const footprint = await buildFootprint({
      cip: String(req.query.cip || ''),
      company: String(req.query.company || ''),
    })
    res.status(200).json(footprint)
  } catch (e) {
    res.status(e?.status || 500).json({
      error: e instanceof Error ? e.message : 'Failed to build footprint',
    })
  }
}
