import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, ReceiptText, XCircle } from 'lucide-react'
import { api, type Schemas } from '../../api/client'
import { PageHeader, errorText, fmtDate } from '../../ui'
import {
  FeeStatusPill,
  FeeTypeChip,
  MethodChip,
  ProgressBar,
  inr,
  paidPercent,
} from '../fees/common'

export function MyFees() {
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<Schemas['MeDto']>('/me') })
  const fees = useQuery({
    queryKey: ['me', 'fees'],
    queryFn: () => api<Schemas['StudentFeeSummaryDto']>('/me/fees'),
  })
  const payments = useQuery({
    queryKey: ['me', 'payments'],
    queryFn: () => api<Schemas['MyPaymentDto'][]>('/me/payments'),
  })
  const requests = useQuery({
    queryKey: ['me', 'payment-submissions'],
    queryFn: () => api<Schemas['MyPaymentSubmissionDto'][]>('/me/payment-submissions'),
  })
  const readOnly = me.data?.student?.status === 'ALUMNI'

  if (fees.isPending) return <div className="dt h-60 animate-pulse" />
  if (fees.isError)
    return (
      <p className="text-sm text-red-700">{errorText(fees.error, "Couldn't load your fees.")}</p>
    )
  const s = fees.data
  const items = [...s.items].sort(
    (a, b) =>
      Number(a.status === 'PAID') - Number(b.status === 'PAID') ||
      (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
  )
  const pendingFor = (feeId: string) =>
    requests.data?.find((r) => r.studentFeeId === feeId && r.status === 'PENDING')
  const recentRequests = [...(requests.data ?? [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)
  const nothingDue = Number(s.remainingAmount) <= 0

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="My fees"
        actions={
          nothingDue ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Nothing due
            </span>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Total fees', s.totalAmount, 'text-heading'],
          ['Paid', s.paidAmount, 'text-green-700'],
          ['Still to pay', s.remainingAmount, nothingDue ? 'text-heading' : 'text-amber-700'],
        ].map(([label, value, tone]) => (
          <div key={label} className="dt flex flex-col gap-1 p-5">
            <span className="text-muted text-[13px]">{label}</span>
            <span className={`font-display text-2xl font-semibold tabular-nums ${tone}`}>
              {inr(value)}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((f) => {
          const pending = pendingFor(f.id)
          const overdue = f.isOverdue && f.status !== 'PAID'
          return (
            <section key={f.id} className="dt flex flex-col gap-3.5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="flex flex-col gap-1">
                  <b className="font-display text-heading text-base font-semibold">{f.title}</b>
                  <FeeTypeChip type={f.feeType} />
                </span>
                <FeeStatusPill status={f.status} isOverdue={f.isOverdue} />
              </div>
              <ProgressBar
                percent={paidPercent(f)}
                tone={f.status === 'PAID' ? 'green' : overdue ? 'red' : 'blue'}
              />
              <div className="flex flex-wrap justify-between gap-2 text-sm tabular-nums">
                <span>
                  <b className="text-heading">{inr(f.paidAmount)}</b> paid of {inr(f.totalAmount)}
                </span>
                {f.dueDate && (
                  <span className={overdue ? 'font-medium text-red-700' : 'text-muted'}>
                    Due {fmtDate(f.dueDate)}
                  </span>
                )}
              </div>
              {pending && (
                <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden /> {inr(pending.amount)} sent on{' '}
                  {fmtDate(pending.createdAt)} is being checked by the office.
                </p>
              )}
              {f.status !== 'PAID' && !readOnly && (
                <Link
                  to={`/me/fees/${f.id}/pay`}
                  className="bg-brand hover:bg-brand-dark inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-white"
                >
                  Pay {inr(f.remainingAmount)}
                </Link>
              )}
            </section>
          )
        })}
        {!items.length && (
          <p className="dt text-muted p-8 text-center text-sm md:col-span-2">No fees yet.</p>
        )}
      </div>

      {recentRequests.length > 0 && (
        <section className="dt">
          <div className="dt-bar">
            <h2 className="dt-title">Payments you sent for checking</h2>
          </div>
          <ul className="flex flex-col">
            {recentRequests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-3 border-t border-slate-100 px-6 py-3.5 text-sm first:border-t-0"
              >
                <span className="flex flex-col gap-0.5">
                  <b className="text-heading">
                    {inr(r.amount)} · {r.feeTitle}
                  </b>
                  <small className="text-muted text-xs">
                    UTR {r.referenceNo} · sent {fmtDate(r.createdAt)}
                  </small>
                  {r.status === 'DECLINED' && r.declineReason && (
                    <small className="text-xs text-red-700">Reason: {r.declineReason}</small>
                  )}
                </span>
                {r.status === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-700">
                    <Clock className="h-4 w-4" aria-hidden /> Being checked
                  </span>
                ) : r.status === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-green-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> Approved
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-red-700">
                      <XCircle className="h-4 w-4" aria-hidden /> Declined
                    </span>
                    {!readOnly && (
                      <Link
                        to={`/me/fees/${r.studentFeeId}/pay`}
                        className="text-brand text-[13px] font-medium"
                      >
                        Send again
                      </Link>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="dt">
        <div className="dt-bar">
          <h2 className="dt-title">Receipts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Paid on</th>
                <th>For</th>
                <th>Method</th>
                <th className="text-right!">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payments.isPending && (
                <tr>
                  <td colSpan={6}>
                    <div className="h-5 animate-pulse rounded-md bg-slate-100" />
                  </td>
                </tr>
              )}
              {payments.data && !payments.data.length && (
                <tr>
                  <td colSpan={6} className="text-muted py-8 text-center text-sm">
                    No payments yet. Paid at the office? It shows up once the office records it.
                  </td>
                </tr>
              )}
              {payments.data?.map((p) => (
                <tr key={p.id}>
                  <td className="text-heading font-mono text-[13px]">{p.receiptNo}</td>
                  <td className="whitespace-nowrap">{fmtDate(p.paidOn)}</td>
                  <td>{p.feeTitle}</td>
                  <td>
                    <MethodChip method={p.method} />
                  </td>
                  <td className="text-heading text-right font-semibold whitespace-nowrap tabular-nums">
                    {inr(p.amount)}
                  </td>
                  <td>
                    <div className="ra">
                      <Link to={`/me/receipts/${p.id}`} aria-label={`Receipt ${p.receiptNo}`}>
                        <ReceiptText className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
