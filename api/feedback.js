/**
 * Vercel serverless feedback endpoint for Field Report v3.
 * No PII. Logs choice for week-one product signal.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { cip, zip, choice } = req.body || {}
  if (!cip || !zip || !choice) {
    res.status(400).json({ error: 'cip, zip, and choice required' })
    return
  }

  console.log('[v3-feedback]', JSON.stringify({ cip, zip, choice }))
  res.status(200).json({ ok: true })
}
