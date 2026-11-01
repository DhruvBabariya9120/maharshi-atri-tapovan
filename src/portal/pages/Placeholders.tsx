import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { useSession } from '../auth/session'

// ponytail: stand-ins until each phase lands; delete a route's entry here when its screen ships.
const phaseFor: [RegExp, string][] = [
  [/^\/admin\/(setup|account)/, 'P1 · Sign-in and setup'],
  [/^\/admin\/(students|promote|users)/, 'P2 · Students and people'],
  [/^\/admin\/(fees|payment-requests)|^\/me\/fees/, 'P3 · Fees and payments'],
  [/^\/admin\/exams|^\/me\/results/, 'P4 · Exams and results'],
  [/^\/admin\/activity|^\/me\/account/, 'P5 · Dashboard, activity, polish'],
]

export function ComingSoon() {
  const { pathname } = useLocation()
  const phase = phaseFor.find(([re]) => re.test(pathname))?.[1] ?? 'a later phase'
  return (
    <div className="bg-tint-blue-soft grid place-items-center rounded-2xl border border-dashed border-blue-200 px-6 py-20 text-center">
      <Construction className="text-brand mb-3 h-8 w-8" aria-hidden />
      <p className="font-display text-heading text-lg font-semibold">This screen isn't built yet</p>
      <p className="text-muted mt-1 text-sm">It's planned for {phase}.</p>
    </div>
  )
}

export function Welcome() {
  const { user } = useSession()
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-heading text-[28px] font-semibold">
        Welcome, {user?.fullName}
      </h1>
      <p className="text-muted text-sm">
        Signed in as {user?.email} ({user?.role === 'ADMIN' ? 'admin' : 'student'}).
      </p>
    </div>
  )
}
