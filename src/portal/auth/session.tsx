import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  api,
  onUnauthorized,
  refreshSession,
  setAccessToken,
  type AuthResponse,
  type AuthUser,
} from '../api/client'

type Status = 'loading' | 'authenticated' | 'anonymous'

type Session = {
  user: AuthUser | null
  status: Status
  /** Store the result of login or accept-invite. */
  signIn: (auth: AuthResponse) => void
  signOut: () => Promise<void>
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  const clear = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    onUnauthorized(clear)
    // The refresh cookie survives reloads; trade it for a fresh access token.
    refreshSession().then((auth) => {
      if (auth) {
        setUser(auth.user)
        setStatus('authenticated')
      } else {
        setStatus('anonymous')
      }
    })
  }, [clear])

  const value = useMemo<Session>(
    () => ({
      user,
      status,
      signIn: (auth) => {
        setAccessToken(auth.accessToken)
        setUser(auth.user)
        setStatus('authenticated')
      },
      signOut: async () => {
        await api('/auth/logout', { method: 'POST' }).catch(() => {})
        clear()
      },
    }),
    [user, status, clear]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export const homeFor = (role: AuthUser['role']) => (role === 'ADMIN' ? '/admin' : '/me')

/** Gate a route tree to one role. Others go to sign-in or to their own home. */
export function RequireRole({ role, children }: { role: AuthUser['role']; children: ReactNode }) {
  const { user, status } = useSession()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <>{children}</>
}

export function FullPageSpinner() {
  return (
    <div className="bg-surface grid min-h-screen place-items-center" role="status">
      <span className="border-tint-blue border-t-brand h-10 w-10 animate-spin rounded-full border-4" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
