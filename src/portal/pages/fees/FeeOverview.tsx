import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { useClasses, useYears } from '../../api/lookups'
import { PageHeader, TableState, fmtDate } from '../../ui'
import { StudentAvatar, fullName } from '../students/common'
import {
  FEE_TYPES,
  FeeStatusPill,
  FeeTypeChip,
  ProgressBar,
  inr,
  paidPercent,
  useStudentNames,
  type FeeType,
} from './common'

const LIMIT = 25

export function FeeOverview() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const classId = params.get('class') ?? ''
  const feeType = (params.get('type') ?? '') as FeeType | ''
  const status = params.get('status') ?? ''
  const page = Number(params.get('page') ?? 1)
  const set = (patch: Record<string, string>) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
        if (!('page' in patch)) next.delete('page')
        return next
      },
      { replace: true }
    )

  const years = useYears()
  const yearId = years.current?.id
  const classes = useClasses(yearId)
  const names = useStudentNames()

  const summary = useQuery({
    queryKey: ['dashboard', yearId],
    queryFn: () =>
      api<Schemas['DashboardSummaryDto']>('/dashboard/summary', {
        query: { academicYearId: yearId },
      }),
    enabled: !!yearId,
  })
  const totals = summary.data?.fees

  const apiStatus = status === 'overdue' ? undefined : status || undefined
  const fees = useQuery({
    queryKey: ['fees', { q, classId, feeType, status, page, yearId }],
    queryFn: () =>
      api<Schemas['PaginatedStudentFeesDto']>('/fees', {
        query: {
          q,
          classId: classId || undefined,
          feeType: feeType || undefined,
          status: apiStatus,
          overdue: status === 'overdue' ? true : undefined,
          academicYearId: yearId,
          page,
          limit: LIMIT,
        },
      }),
    enabled: !!yearId,
    placeholderData: keepPreviousData,
  })
  const items = fees.data?.items ?? []
  const total = fees.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / LIMIT))

  const stats = [
    { label: 'Billed', value: totals?.totalAmount, tone: 'text-heading' },
    { label: 'Collected', value: totals?.collectedAmount, tone: 'text-green-700' },
    { label: 'Pending', value: totals?.pendingAmount, tone: 'text-heading' },
    {
      label: `Overdue${totals ? ` · ${totals.overdueCount} fees` : ''}`,
      value: totals?.overdueAmount,
      tone: 'text-red-700',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Fees"
        sub={
          years.current
            ? `Every fee for ${years.current.name}, with what's paid and what's left.`
            : undefined
        }
        actions={
          <Link
            to="/admin/fees/assign"
            className="bg-brand hover:bg-brand-dark inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)]"
          >
            <Plus className="h-4 w-4" aria-hidden /> Assign fees
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="dt flex flex-col gap-1.5 p-5">
            <span className="text-muted text-[13px]">{s.label}</span>
            {summary.isPending ? (
              <span className="h-8 w-32 animate-pulse rounded-md bg-slate-100" />
            ) : (
              <span className={`font-display text-2xl font-semibold tabular-nums ${s.tone}`}>
                {inr(s.value)}
              </span>
            )}
          </div>
        ))}
      </div>

      {totals && totals.byType.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {totals.byType.map((t) => (
            <button
              key={t.feeType}
              type="button"
              onClick={() => set({ type: feeType === t.feeType ? '' : t.feeType })}
              aria-pressed={feeType === t.feeType}
              className={`flex flex-col rounded-xl border px-3.5 py-2 text-left text-xs ${feeType === t.feeType ? 'border-brand bg-tint-blue-soft' : 'border-border bg-white hover:border-blue-300'}`}
            >
              <b className="text-heading text-[13px]">{FEE_TYPES[t.feeType]}</b>
              <span className="text-muted tabular-nums">
                {inr(t.collectedAmount)} of {inr(t.totalAmount)}
              </span>
            </button>
          ))}
        </div>
      )}

      <section className="dt">
        <div className="dt-bar">
          <label className="border-border text-muted flex min-h-11 flex-1 basis-64 items-center gap-2 rounded-xl border bg-slate-50 px-3 text-sm">
            <Search className="h-4 w-4" aria-hidden />
            <input
              aria-label="Search by student, admission number or fee title"
              placeholder="Student, admission no. or fee"
              defaultValue={q}
              onChange={(e) => set({ q: e.target.value.trim() })}
              className="text-heading flex-1 bg-transparent outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Select
              aria-label="Class"
              value={classId}
              onChange={(e) => set({ class: e.target.value })}
              className="min-h-11 w-auto py-2"
            >
              <option value="">All classes</option>
              {classes.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.standard}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Fee type"
              value={feeType}
              onChange={(e) => set({ type: e.target.value })}
              className="min-h-11 w-auto py-2"
            >
              <option value="">All fee types</option>
              {(Object.keys(FEE_TYPES) as FeeType[]).map((t) => (
                <option key={t} value={t}>
                  {FEE_TYPES[t]}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Status"
              value={status}
              onChange={(e) => set({ status: e.target.value })}
              className="min-h-11 w-auto py-2"
            >
              <option value="">All statuses</option>
              <option value="overdue">Overdue</option>
              <option value="PENDING">Nothing paid</option>
              <option value="PARTIAL">Part paid</option>
              <option value="PAID">Paid</option>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Fee</th>
                <th className="text-right!">Amount</th>
                <th>Paid so far</th>
                <th className="text-right!">Remaining</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                cols={7}
                loading={fees.isPending}
                error={fees.error}
                empty={!items.length}
                emptyText={
                  q || classId || feeType
                    ? 'No fees match these filters.'
                    : 'No fees here yet. Use "Assign fees" to bill a class.'
                }
                onRetry={() => fees.refetch()}
              />
              {items.map((f) => {
                const s = names?.get(f.studentId)
                const href = `/admin/students/${f.studentId}?tab=fees`
                return (
                  <tr key={f.id} className="cursor-pointer" onClick={() => navigate(href)}>
                    <td>
                      {s ? (
                        <span className="flex items-center gap-3">
                          <StudentAvatar student={s} size={34} />
                          <span className="flex flex-col">
                            <Link
                              to={href}
                              onClick={(e) => e.stopPropagation()}
                              className="text-heading hover:text-brand font-semibold"
                            >
                              {fullName(s)}
                            </Link>
                            <small className="text-muted font-mono text-xs">{s.admissionNo}</small>
                          </span>
                        </span>
                      ) : (
                        <span className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                      )}
                    </td>
                    <td>
                      <span className="flex flex-col items-start gap-1">
                        <span className="text-heading">{f.title}</span>
                        <FeeTypeChip type={f.feeType} />
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap tabular-nums">
                      {inr(f.totalAmount)}
                    </td>
                    <td className="min-w-40">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1">
                          <ProgressBar
                            percent={paidPercent(f)}
                            tone={
                              f.isOverdue && f.status !== 'PAID'
                                ? 'red'
                                : f.status === 'PAID'
                                  ? 'green'
                                  : 'blue'
                            }
                          />
                        </div>
                        <span className="text-muted w-9 text-right text-xs tabular-nums">
                          {paidPercent(f)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-heading text-right font-semibold whitespace-nowrap tabular-nums">
                      {inr(f.remainingAmount)}
                    </td>
                    <td
                      className={`whitespace-nowrap ${f.isOverdue && f.status !== 'PAID' ? 'font-medium text-red-700' : 'text-muted'}`}
                    >
                      {f.dueDate ? fmtDate(f.dueDate) : '—'}
                    </td>
                    <td>
                      <FeeStatusPill status={f.status} isOverdue={f.isOverdue} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="text-muted flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3.5 text-[13px]">
          <span>{total ? `${total} fees` : '0 fees'}</span>
          <nav aria-label="Pages" className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => set({ page: String(page - 1) })}
              className="border-border grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pages}
              onClick={() => set({ page: String(page + 1) })}
              className="border-border grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </section>
    </div>
  )
}
