import type { components } from './schema'

export type Schemas = components['schemas']
export type AuthUser = Schemas['AuthUserDto']
export type AuthResponse = Schemas['AuthResponseDto']

const BASE = '/api/v1'

/** Error thrown for any non-2xx response. `body` follows the API's ErrorDto. */
export class ApiError extends Error {
  status: number
  body: (Schemas['ErrorDto'] & { retryAfter?: number }) | null

  constructor(status: number, body: ApiError['body']) {
    const msg = body?.message
    super(Array.isArray(msg) ? msg.join(', ') : (msg ?? `Request failed (${status})`))
    this.status = status
    this.body = body
  }

  /** Validation messages for a 400, one per field problem. */
  get messages(): string[] {
    const msg = this.body?.message
    return Array.isArray(msg) ? msg : msg ? [msg] : []
  }
}

// The access token lives in memory only. The refresh token is an httpOnly
// cookie scoped to /api/v1/auth, so a page reload calls refresh() to get a new one.
let accessToken: string | null = null
let refreshing: Promise<AuthResponse | null> | null = null
let onSessionLost: () => void = () => {}

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function onUnauthorized(handler: () => void) {
  onSessionLost = handler
}

/**
 * The API rotates the refresh token on every use and revokes the whole session if an old
 * one is ever sent again. What this guards against:
 * - two callers in this tab at once: they share one request (`refreshing`).
 * - two open tabs refreshing at once: a cross-tab lock makes the second wait, so it sends
 *   the new cookie.
 * - the tab closing or navigating mid-refresh: `keepalive` lets the request finish so the
 *   new cookie still lands.
 * Not covered: a reload that sends its own refresh before the previous one has answered
 * (the API is often 1-3 s away). Both carry the same old cookie and the API revokes the
 * session. That needs a short reuse grace period on the API side.
 */
const refreshRequest = () =>
  fetch(`${BASE}/auth/refresh`, { method: 'POST', keepalive: true, credentials: 'same-origin' })
const acrossTabs = <T>(fn: () => Promise<T>): Promise<T> =>
  typeof navigator !== 'undefined' && 'locks' in navigator
    ? navigator.locks.request('tapovan-auth-refresh', fn)
    : fn()

export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= acrossTabs(refreshRequest)
    .then(async (res) => {
      if (!res.ok) return null
      const auth = (await res.json()) as AuthResponse
      accessToken = auth.accessToken
      return auth
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

export async function api<T>(path: string, opts: Options = {}, retried = false): Promise<T> {
  const qs = opts.query
    ? '?' +
      new URLSearchParams(
        Object.entries(opts.query)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : ''

  const res = await fetch(`${BASE}${path}${qs}`, {
    method: opts.method ?? 'GET',
    headers: {
      ...(opts.body !== undefined && { 'Content-Type': 'application/json' }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  // Expired access token: refresh once and retry. Auth routes handle their own 401s.
  if (res.status === 401 && !retried && !path.startsWith('/auth/')) {
    if (await refreshSession()) return api<T>(path, opts, true)
    accessToken = null
    onSessionLost()
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
