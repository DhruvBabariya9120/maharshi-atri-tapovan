import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ClipboardCheck,
  FileClock,
  MailWarning,
  Plus,
  Users,
  Wallet,
} from 'lucide-react'
import { api, type Schemas } from '../api/client'
import { useYears } from '../api/lookups'
import { useSession } from '../auth/session'
import { PageHeader, Pill, errorText, fmtDate } from '../ui'
import { FEE_TYPES, FeeTypeChip, MethodChip, ProgressBar, inr } from './fees/common'

const EXAM_TYPES = {
  SEMESTER: 'Semester',
  WEEKLY_TEST: 'Weekly test',
  MONTHLY_TEST: 'Monthly test',
  OTHER_TEST: 'Test',
} as const

const pct = (part: string, whole: string) => {
  const w = Number(whole)
  return w > 0 ? Math.min(100, Math.round((Number(part) / w) * 100)) : 0
}

/** "₹14.1L" for the per-standard bars, where full rupee amounts would crowd the row. */
const short = (amount: string) => {
  const n = Number(amount)
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function Stat({
  icon,
  label,
  value,
  sub,
  tone = 'text-heading',
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: string
}) {
  return (
    <div className="dt flex flex-col gap-2 p-5">
      <span className="text-muted flex items-center gap-2 text-[13px] font-medium">
        {icon}
        {label}
      </span>
      <span className={`font-display text-[28px] leading-tight font-semibold tabular-nums ${tone}`}>
        {value}
      </span>
      {sub && <span className="text-content text-[13px]">{sub}</span>}
    </div>
  )
}

export function Dashboard() {
  const { user } = useSession()
  const years = useYears()
  const yearId = years.current?.id
  const q = useQuery({
    queryKey: ['dashboard', yearId],
    queryFn: () =>
      api<Schemas['DashboardSummaryDto']>('/dashboard/summary', {
        query: { academicYearId: yearId },
      }),
    enabled: !!yearId,
  })
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const header = (
    <PageHeader
      title={`${greeting()}, ${user?.fullName.split(' ')[0] ?? ''}`}
      sub={`${today}${years.current ? ` · Academic year ${years.current.name}` : ''}`}
      actions={
        <>
          <Link
            to="/admin/payment-requests"
            className="border-border text-heading hover:border-brand hover:text-brand inline-flex min-h-11 items-center rounded-full border bg-white px-5 text-sm font-medium"
          >
            Payment requests
          </Link>
          <Link
            to="/admin/students/new"
            className="bg-brand hover:bg-brand-dark inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)]"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add student
          </Link>
        </>
      }
    />
  )

  if (!years.isPending && !years.current)
    return (
      <div className="flex flex-col gap-5">
        {header}
        <div className="dt flex flex-col items-start gap-2 p-6 text-sm">
          <b className="text-heading">Set the current academic year to see the dashboard.</b>
          <Link to="/admin/setup/years" className="text-brand font-medium">
            Go to academic years
          </Link>
        </div>
      </div>
    )
  if (q.isError)
    return (
      <div className="flex flex-col gap-5">
        {header}
        <p className="text-sm text-red-700">{errorText(q.error, "Couldn't load the dashboard.")}</p>
      </div>
    )
  if (!q.data)
    return (
      <div className="flex flex-col gap-5">
        {header}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="dt h-32 animate-pulse" />
          ))}
        </div>
        <div className="dt h-72 animate-pulse" />
      </div>
    )

  const d = q.data
  const f = d.fees
  const a = d.attention
  const attention = [
    a.pendingPaymentSubmissions > 0 && {
      to: '/admin/payment-requests',
      icon: <ClipboardCheck className="h-5 w-5" aria-hidden />,
      title: `${a.pendingPaymentSubmissions} payment ${a.pendingPaymentSubmissions === 1 ? 'request' : 'requests'} waiting`,
      body: 'Check them against the bank statement and approve or decline.',
      tone: 'bg-amber-50 text-amber-900',
    },
    f.overdueCount > 0 && {
      to: '/admin/fees?status=overdue',
      icon: <AlertTriangle className="h-5 w-5" aria-hidden />,
      title: `${f.overdueCount} overdue ${f.overdueCount === 1 ? 'fee' : 'fees'} · ${inr(f.overdueAmount)}`,
      body: 'Past the due date and not fully paid.',
      tone: 'bg-red-50 text-red-900',
    },
    a.draftExamsMissingMarks > 0 && {
      to: '/admin/exams',
      icon: <FileClock className="h-5 w-5" aria-hidden />,
      title: `${a.draftExamsMissingMarks} draft ${a.draftExamsMissingMarks === 1 ? 'exam is' : 'exams are'} missing marks`,
      body: "Results can't be published until every paper has marks.",
      tone: 'bg-blue-50 text-blue-900',
    },
    a.examsChangedSincePublish > 0 && {
      to: '/admin/exams',
      icon: <FileClock className="h-5 w-5" aria-hidden />,
      title: `${a.examsChangedSincePublish} published ${a.examsChangedSincePublish === 1 ? 'exam has' : 'exams have'} changed marks`,
      body: 'Publish again so students see the updated results.',
      tone: 'bg-blue-50 text-blue-900',
    },
    a.expiredInvites > 0 && {
      to: '/admin/users?tab=invites',
      icon: <MailWarning className="h-5 w-5" aria-hidden />,
      title: `${a.expiredInvites} ${a.expiredInvites === 1 ? 'invite has' : 'invites have'} expired`,
      body: "Those people haven't set a password yet. Resend the links.",
      tone: 'bg-pink-50 text-pink-900',
    },
  ].filter(Boolean) as { to: string; icon: ReactNode; title: string; body: string; tone: string }[]

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={<Users className="h-4 w-4" aria-hidden />}
          label="Active students"
          value={d.students.active}
          sub={`${d.students.total} in all · ${d.students.alumni} alumni`}
        />
        <Stat
          icon={<Wallet className="h-4 w-4" aria-hidden />}
          label="Fees collected"
          value={inr(f.collectedAmount)}
          tone="text-green-700"
          sub={`${pct(f.collectedAmount, f.totalAmount)}% of ${inr(f.totalAmount)} billed`}
        />
        <Stat
          icon={<Wallet className="h-4 w-4" aria-hidden />}
          label="Still to collect"
          value={inr(f.pendingAmount)}
          sub="Not yet paid this year"
        />
        <Stat
          icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
          label="Overdue"
          value={inr(f.overdueAmount)}
          tone={f.overdueCount ? 'text-red-700' : 'text-heading'}
          sub={`${f.overdueCount} ${f.overdueCount === 1 ? 'fee' : 'fees'} past the due date`}
        />
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section className="dt flex min-w-0 flex-[2_1_480px] flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-heading text-[17px] font-semibold">
              Fees collected by standard
            </h2>
            <span className="text-muted text-[13px]">Collected of billed</span>
          </div>
          {d.feesByStandard.length ? (
            <ul className="flex flex-col gap-3.5">
              {d.feesByStandard.map((s) => (
                <li
                  key={s.standard}
                  className="grid grid-cols-[64px_minmax(0,1fr)_120px] items-center gap-3.5 text-[13px]"
                >
                  <span className="text-heading font-semibold">{s.standard}</span>
                  <ProgressBar percent={pct(s.collectedAmount, s.billedAmount)} />
                  <span className="text-content text-right tabular-nums">
                    {short(s.collectedAmount)} of {short(s.billedAmount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-sm">No fees billed this year yet.</p>
          )}
          {f.byType.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {f.byType.map((t) => (
                <Link
                  key={t.feeType}
                  to={`/admin/fees?type=${t.feeType}`}
                  className="border-border hover:border-brand flex flex-col rounded-xl border bg-white px-3.5 py-2 text-xs"
                >
                  <b className="text-heading text-[13px]">{FEE_TYPES[t.feeType]}</b>
                  <span className="text-muted tabular-nums">
                    {pct(t.collectedAmount, t.totalAmount)}% · {short(t.collectedAmount)} of{' '}
                    {short(t.totalAmount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="dt flex min-w-0 flex-[1_1_320px] flex-col gap-3 p-5 sm:p-6">
          <h2 className="font-display text-heading text-[17px] font-semibold">Needs attention</h2>
          {attention.length ? (
            attention.map((x) => (
              <Link
                key={x.title}
                to={x.to}
                className={`flex gap-3 rounded-xl p-3.5 hover:brightness-[0.98] ${x.tone}`}
              >
                <span className="mt-0.5 shrink-0">{x.icon}</span>
                <span className="flex flex-col gap-0.5">
                  <b className="text-sm">{x.title}</b>
                  <span className="text-[13px] opacity-90">{x.body}</span>
                </span>
              </Link>
            ))
          ) : (
            <p className="rounded-xl bg-green-50 p-3.5 text-sm text-green-800">
              All caught up. Nothing needs you right now.
            </p>
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section className="dt min-w-0 flex-[2_1_480px]">
          <div className="dt-bar">
            <h2 className="dt-title">Recent payments</h2>
            <Link to="/admin/fees" className="text-brand text-[13px] font-medium">
              All fees
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Method</th>
                  <th className="text-right!">Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {!d.recentPayments.length && (
                  <tr>
                    <td colSpan={4} className="text-muted py-8 text-center text-sm">
                      No payments recorded this year yet.
                    </td>
                  </tr>
                )}
                {d.recentPayments.map((p) => (
                  <tr key={p.receiptNo}>
                    <td>
                      <span className="flex flex-col items-start gap-1">
                        <b className="text-heading font-semibold">{p.studentName}</b>
                        <span className="flex flex-wrap items-center gap-1.5 text-xs">
                          <FeeTypeChip type={p.feeType} />
                          <span className="text-muted font-mono">{p.receiptNo}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <MethodChip method={p.method} />
                    </td>
                    <td className="text-heading text-right font-bold whitespace-nowrap tabular-nums">
                      {inr(p.amount)}
                    </td>
                    <td className="text-muted whitespace-nowrap">{fmtDate(p.paidOn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dt flex min-w-0 flex-[1_1_320px] flex-col gap-3 p-5 sm:p-6">
          <h2 className="font-display text-heading text-[17px] font-semibold">Recent exams</h2>
          {d.recentExams.length ? (
            <ul className="flex flex-col">
              {d.recentExams.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 border-t border-slate-100 py-3 text-sm first:border-t-0"
                >
                  <span className="flex flex-col">
                    <b className="text-heading">{e.name}</b>
                    <small className="text-muted text-xs">
                      {e.className} · {EXAM_TYPES[e.type]}
                      {e.status === 'PUBLISHED' &&
                        e.publishedAt &&
                        ` · published ${fmtDate(e.publishedAt)}`}
                    </small>
                  </span>
                  {e.status === 'PUBLISHED' ? (
                    <Pill tone="green">Published</Pill>
                  ) : (
                    <Pill tone="slate">Draft</Pill>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-sm">No exams yet this year.</p>
          )}
        </section>
      </div>
    </div>
  )
}
