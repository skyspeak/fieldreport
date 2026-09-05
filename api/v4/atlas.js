import { aoiConfigured } from '../../server/aoiClient.mjs'
import { buildAtlas } from '../../server/buildAtlas.mjs'

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
    const atlas = await buildAtlas({ cip: String(req.query.cip || '') })
    res.status(200).json({
      ...atlas,
      metros: atlas.metros.map(({ employerNames: _n, ...m }) => m),
    })
  } catch (e) {
    res.status(e?.status || 500).json({
      error: e instanceof Error ? e.message : 'Failed to build atlas',
    })
  }
}
