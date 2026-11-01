import { NavLink, Outlet } from 'react-router-dom'
import { FileCheck2, LogOut, UserRound, Wallet } from 'lucide-react'
import logo from '../../assets/logo-128.png'
import { site } from '../../data/site'
import { useSession } from '../auth/session'

const tabs = [
  { to: '/me', label: 'My profile', short: 'Profile', icon: UserRound, end: true },
  { to: '/me/fees', label: 'My fees', short: 'Fees', icon: Wallet },
  { to: '/me/results', label: 'My results', short: 'Results', icon: FileCheck2 },
]

/** Student portal: top tabs on tablet and desktop, bottom tab bar on phones. */
export function PortalShell() {
  const { user, signOut } = useSession()
  const initials = (user?.fullName ?? '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="bg-surface flex min-h-screen flex-col pb-16 sm:pb-0">
      <header className="border-border bg-card sticky top-0 z-30 border-b">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-10 w-10 rounded-full" />
            <span className="font-display text-heading text-base font-semibold">
              <span className="hidden md:inline">{site.name}</span>
              <span className="md:hidden">Tapovan</span>
            </span>
          </div>
          <nav aria-label="Portal" className="hidden gap-1 sm:flex">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `inline-flex min-h-11 items-center rounded-full px-4 text-sm ${isActive ? 'bg-tint-blue text-brand font-semibold' : 'text-content hover:text-brand font-medium'}`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NavLink
              to="/me/account"
              aria-label={`Account settings for ${user?.fullName ?? ''}`}
              className="bg-brand grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold text-white"
            >
              {initials}
            </NavLink>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="text-content hover:bg-surface hover:text-brand grid h-10 w-10 place-items-center rounded-full"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>

      <nav
        aria-label="Portal"
        className="border-border bg-card fixed inset-x-0 bottom-0 z-30 flex border-t sm:hidden"
      >
        {tabs.map(({ to, short, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs ${isActive ? 'text-brand font-semibold' : 'text-muted font-medium'}`
            }
          >
            <Icon className="h-5 w-5" aria-hidden />
            {short}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
