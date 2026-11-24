import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { useClasses, useYears } from '../../api/lookups'
import { PageHeader, Pill, TableState, fmtDate } from '../../ui'
import { FeeTypeChip, MethodChip, REQUEST_STATUS, inr, waited, waitedTooLong } from './common'

type Status = Schemas['PaymentSubmissionDto']['status']
const LIMIT = 25

export function PaymentRequests() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') ?? 'PENDING') as Status | 'ALL'
  const method = params.get('method') ?? ''
  const classId = params.get('class') ?? ''
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
  const classes = useClasses(years.current?.id)
  const requests = useQuery({
    queryKey: ['payment-submissions', { status, method, classId, page }],
    queryFn: () =>
      api<Schemas['PaginatedPaymentSubmissionsDto']>('/payment-submissions', {
        query: {
          status: status === 'ALL' ? undefined : status,
          method: method || undefined,
          classId: classId || undefined,
          page,
          limit: LIMIT,
        },
      }),
    placeholderData: keepPreviousData,
  })
  const items = requests.data?.items ?? []
  const total = requests.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Payment requests"
        sub="Students who paid by UPI or bank transfer and sent proof. Check each one against the bank statement, then approve or decline."
      />
      <section className="dt">
        <div className="dt-bar">
          <div role="tablist" aria-label="Status" className="flex flex-wrap gap-1.5">
            {(['PENDING', 'APPROVED', 'DECLINED', 'ALL'] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={status === s}
                onClick={() => set({ status: s })}
                className={`min-h-10 rounded-full border px-4 text-[13px] font-medium ${status === s ? 'border-brand bg-brand text-white' : 'border-border text-content bg-white'}`}
              >
                {s === 'ALL' ? 'All' : REQUEST_STATUS[s].label}
                {s === status && requests.data ? ` · ${total}` : ''}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              aria-label="Method"
              value={method}
              onChange={(e) => set({ method: e.target.value })}
              className="min-h-11 w-auto py-2"
            >
              <option value="">UPI and bank transfer</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
            </Select>
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
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Fee</th>
                <th className="text-right!">Amount</th>
                <th>Method and UTR</th>
                <th>Paid on</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                cols={7}
                loading={requests.isPending}
                error={requests.error}
                empty={!items.length}
                emptyText={
                  status === 'PENDING'
                    ? 'Nothing waiting. New requests show up here.'
                    : 'No requests match these filters.'
                }
                onRetry={() => requests.refetch()}
              />
              {items.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/payment-requests/${r.id}`)}
                >
                  <td>
                    <Link
                      to={`/admin/payment-requests/${r.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-heading hover:text-brand font-semibold"
                    >
                      {r.studentName}
                    </Link>
                  </td>
                  <td>
                    <span className="flex flex-col items-start gap-1">
                      <span className="text-heading">{r.feeTitle}</span>
                      <FeeTypeChip type={r.feeType} />
                    </span>
                  </td>
                  <td className="text-heading text-right font-bold whitespace-nowrap tabular-nums">
                    {inr(r.amount)}
                  </td>
                  <td>
                    <span className="flex flex-col items-start gap-1">
                      <MethodChip method={r.method} />
                      <span className="text-muted font-mono text-xs">{r.referenceNo}</span>
                      {r.utrSeenBefore && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> UTR used before
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{fmtDate(r.paidOn)}</td>
                  <td
                    className={`whitespace-nowrap ${r.status === 'PENDING' && waitedTooLong(r.createdAt) ? 'font-medium text-red-700' : 'text-muted'}`}
                  >
                    {waited(r.createdAt)}
                  </td>
                  <td>
                    <Pill tone={REQUEST_STATUS[r.status].tone}>
                      {REQUEST_STATUS[r.status].label}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3.5 text-[13px]">
          <span>{total} requests</span>
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
