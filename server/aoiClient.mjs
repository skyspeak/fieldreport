/**
 * AOI (aonav.ai) authenticated DSL client for server-side Field Report builds.
 */
const BASE = process.env.AOI_BASE_URL || 'https://aonav.ai'

/** @type {{ accessToken: string, refreshToken: string, expiresAt: number } | null} */
let auth = null

async function login() {
  const user = process.env.AOI_USERNAME
  const pass = process.env.AOI_PASSWORD
  if (!user || !pass) {
    throw new Error('AOI_USERNAME and AOI_PASSWORD must be set on the server')
  }
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass }),
  })
  const body = await res.json()
  if (!body?.tokens?.access_token) {
    throw new Error(`AOI login failed: ${JSON.stringify(body).slice(0, 200)}`)
  }
  const expiresIn = Number(body.tokens.expires_in) || 86400
  auth = {
    accessToken: body.tokens.access_token,
    refreshToken: body.tokens.refresh_token,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}

async function ensureAuth() {
  if (!auth || Date.now() >= auth.expiresAt - 5 * 60 * 1000) {
    await login()
  }
}

/**
 * @param {string} query
 */
export async function aoiDsl(query) {
  await ensureAuth()
  const res = await fetch(`${BASE}/api/dsl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.accessToken}`,
    },
    body: JSON.stringify({ query }),
  })
  const body = await res.json()
  if (res.status === 401) {
    await login()
    return aoiDsl(query)
  }
  if (!res.ok || body?.success === false) {
    throw new Error(`AOI DSL error: ${JSON.stringify(body).slice(0, 400)}`)
  }
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

export function aoiConfigured() {
  return Boolean(process.env.AOI_USERNAME && process.env.AOI_PASSWORD)
}
