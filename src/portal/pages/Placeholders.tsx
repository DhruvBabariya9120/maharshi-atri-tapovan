import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { homeFor, useSession } from '../auth/session'

/** Unknown routes inside /admin or /me. */
export function PortalNotFound() {
  const { user } = useSession()
  const home = user ? homeFor(user.role) : '/login'
  return (
    <div className="bg-tint-blue-soft grid place-items-center rounded-2xl border border-dashed border-blue-200 px-6 py-20 text-center">
      <Compass className="text-brand mb-3 h-8 w-8" aria-hidden />
      <h1 className="font-display text-heading text-lg font-semibold">This page doesn't exist</h1>
      <p className="text-muted mt-1 text-sm">The link may be old, or the page was moved.</p>
      <Link to={home} className="text-brand mt-4 text-sm font-semibold">
        Go to {user?.role === 'STUDENT' ? 'my profile' : 'the dashboard'}
      </Link>
    </div>
  )
}
