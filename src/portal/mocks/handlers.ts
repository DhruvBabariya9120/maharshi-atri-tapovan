import { delay, http, HttpResponse } from 'msw'
import type { Schemas } from '../api/client'

// Dev-only stand-in for the backend while it answers 501. Shapes follow openapi/tapovan.json.
// Accounts: admin@tapovan.test and guardian@example.com, password "password123".
// Tokens for links: ?token=valid, ?token=expired, ?token=revoked.

const users: Schemas['AuthUserDto'][] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'admin@tapovan.test',
    role: 'ADMIN',
    fullName: 'School Admin',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'guardian@example.com',
    role: 'STUDENT',
    fullName: 'Aarav Patel',
  },
]
const PASSWORD = 'password123'
const SESSION_KEY = 'mock-session-user'
const failures = new Map<string, number>()

export const error = (statusCode: number, message: string | string[], extra?: object) =>
  HttpResponse.json(
    {
      statusCode,
      message,
      error: String(statusCode),
      path: '',
      timestamp: new Date().toISOString(),
      ...extra,
    },
    { status: statusCode }
  )

// Stands in for the httpOnly refresh cookie so a reload keeps you signed in.
const session = {
  get: () => users.find((u) => u.id === sessionStorage.getItem(SESSION_KEY)) ?? null,
  set: (u: Schemas['AuthUserDto'] | null) =>
    u ? sessionStorage.setItem(SESSION_KEY, u.id) : sessionStorage.removeItem(SESSION_KEY),
}

const authResponse = (user: Schemas['AuthUserDto']): Schemas['AuthResponseDto'] => ({
  accessToken: `mock.${user.id}.${Date.now()}`,
  expiresIn: 900,
  user,
})

export const handlers = [
  http.post('/api/v1/auth/login', async ({ request }) => {
    await delay(400)
    const { email, password } = (await request.json()) as Schemas['LoginDto']
    const key = email.toLowerCase()
    if ((failures.get(key) ?? 0) >= 10) return error(423, 'Account locked', { retryAfter: 900 })
    const user = users.find((u) => u.email === key)
    if (!user || password !== PASSWORD) {
      failures.set(key, (failures.get(key) ?? 0) + 1)
      return error(401, 'Invalid email or password')
    }
    failures.delete(key)
    session.set(user)
    return HttpResponse.json(authResponse(user))
  }),

  http.post('/api/v1/auth/refresh', async () => {
    await delay(150)
    const user = session.get()
    return user ? HttpResponse.json(authResponse(user)) : error(401, 'Missing refresh token')
  }),

  http.post('/api/v1/auth/logout', () => {
    session.set(null)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/v1/auth/forgot-password', async () => {
    await delay(400)
    return HttpResponse.json({})
  }),

  http.post('/api/v1/auth/reset-password', async ({ request }) => {
    await delay(400)
    const { token } = (await request.json()) as Schemas['ResetPasswordDto']
    return token === 'valid'
      ? new HttpResponse(null, { status: 204 })
      : error(410, 'Reset token expired')
  }),

  http.get('/api/v1/auth/invitations/:token', async ({ params }) => {
    await delay(300)
    if (params.token === 'revoked') return error(404, 'Unknown or revoked invitation')
    if (params.token !== 'valid') return error(410, 'Invitation expired or already accepted')
    return HttpResponse.json({
      email: 'guardian@example.com',
      role: 'STUDENT',
      fullName: 'Aarav Patel',
      expiresAt: new Date(Date.now() + 72 * 3600_000).toISOString(),
    } satisfies Schemas['InvitationPreviewDto'])
  }),

  http.post('/api/v1/auth/invitations/accept', async ({ request }) => {
    await delay(400)
    const { token } = (await request.json()) as Schemas['AcceptInvitationDto']
    if (token !== 'valid') return error(410, 'Invitation expired')
    session.set(users[1])
    return HttpResponse.json(authResponse(users[1]))
  }),
]
