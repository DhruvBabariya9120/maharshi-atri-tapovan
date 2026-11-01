import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity,
  ArrowUp,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  UserCircle,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import logo from '../../assets/logo-128.png'
import { useSession } from '../auth/session'

type Item = { to: string; label: string; icon: LucideIcon; end?: boolean }

const nav: Item[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/promote', label: 'Promote', icon: ArrowUp },
  { to: '/admin/fees', label: 'Fees', icon: Wallet },
  { to: '/admin/payment-requests', label: 'Payment requests', icon: ClipboardCheck },
  { to: '/admin/exams', label: 'Exams', icon: FileText },
  { to: '/admin/setup', label: 'Setup', icon: Settings },
  { to: '/admin/users', label: 'Users and invites', icon: Mail },
  { to: '/admin/activity', label: 'Activity log', icon: Activity },
]

const setupNav = [
  { to: '/admin/setup/years', label: 'Academic years' },
  { to: '/admin/setup/classes', label: 'Classes' },
  { to: '/admin/setup/subjects', label: 'Subjects' },
  { to: '/admin/setup/grades', label: 'Grade scales' },
  { to: '/admin/setup/payment', label: 'Payment details' },
]

const pill = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center gap-3 rounded-full px-3.5 text-sm transition-colors ${
    isActive
      ? 'bg-tint-blue font-semibold text-brand'
      : 'font-medium text-content hover:bg-tint-blue-soft hover:text-brand'
  }`

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const inSetup = pathname.startsWith('/admin/setup')

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-3 px-2">
        <img src={logo} alt="" className="h-10 w-10 rounded-full" />
        <div className="flex flex-col leading-tight">
          <span className="font-display text-heading text-[15px] font-semibold">Tapovan</span>
          <span className="text-muted text-xs">Admin panel</span>
        </div>
      </div>
      <nav aria-label="Admin" className="flex flex-col gap-1" onClick={onNavigate}>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <div key={to}>
            <NavLink to={to} end={end} className={pill}>
              <Icon className="h-4.5 w-4.5" aria-hidden />
              {label}
            </NavLink>
            {to === '/admin/setup' && inSetup && (
              <div className="mt-1 flex flex-col pl-11">
                {setupNav.map((s) => (
                  <NavLink
                    key={s.to}
                    to={s.to}
                    className={({ isActive }) =>
                      `py-2 text-[13px] ${isActive ? 'text-brand font-semibold' : 'text-muted hover:text-brand'}`
                    }
                  >
                    {s.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="mt-auto" onClick={onNavigate}>
        <NavLink to="/admin/account" className={pill}>
          <UserCircle className="h-4.5 w-4.5" aria-hidden />
          Account settings
        </NavLink>
      </div>
    </div>
  )
}

export function AdminShell() {
  const { user, signOut } = useSession()
  const [open, setOpen] = useState(false)
  const initials = (user?.fullName ?? '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="bg-surface flex min-h-screen">
      <aside className="border-border bg-card sticky top-0 hidden h-screen w-62 shrink-0 overflow-y-auto border-r lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <aside className="bg-card relative h-full w-72 max-w-[85vw] overflow-y-auto shadow-xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="text-content hover:bg-surface absolute top-5 right-3 grid h-10 w-10 place-items-center rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-card sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 sm:px-8">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="text-heading hover:bg-surface grid h-11 w-11 place-items-center rounded-full lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-2.5">
              <span className="bg-brand grid h-9 w-9 place-items-center rounded-full text-[13px] font-semibold text-white">
                {initials}
              </span>
              <span className="text-heading hidden text-sm font-medium sm:inline">
                {user?.fullName}
              </span>
            </span>
            <button
              type="button"
              onClick={signOut}
              className="border-border text-content hover:border-brand hover:text-brand inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-310 px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
