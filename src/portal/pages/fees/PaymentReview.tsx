import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Check, ExternalLink, Loader2, ReceiptText } from 'lucide-react'
import { FieldWrap, Input } from '../../../components/ui/Field'
import { ApiError, api, type Schemas } from '../../api/client'
import { Btn, Dialog, Pill, errorText, fmtDate } from '../../ui'
import { FeeTypeChip, METHODS, REQUEST_STATUS, inr, waited } from './common'

const DECLINE_REASONS = [
  'UTR not found in the bank statement',
  'Amount received is different',
  'Screenshot is unclear',
  'Payment was for another student',
]

export function PaymentReview() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const req = useQuery({
    queryKey: ['payment-submissions', id],
    queryFn: () => api<Schemas['PaymentSubmissionDetailDto']>(`/payment-submissions/${id}`),
  })
  const fees = useQuery({
    queryKey: ['students', req.data?.studentId, 'fees'],
    queryFn: () =>
      api<Schemas['AdminStudentFeeSummaryDto']>(`/students/${req.data!.studentId}/fees`),
    enabled: !!req.data,
  })
  const [checks, setChecks] = useState({ utr: false, amount: false })
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')

  const after = () => {
    qc.invalidateQueries({ queryKey: ['payment-submissions'] })
    qc.invalidateQueries({ queryKey: ['students', req.data?.studentId, 'fees'] })
    qc.invalidateQueries({ queryKey: ['fees'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
  const approve = useMutation({
    mutationFn: () =>
      api<Schemas['FeePaymentDto']>(`/payment-submissions/${id}/approve`, { method: 'POST' }),
    onSuccess: (p) => {
      toast.success(`Approved · receipt ${p.receiptNo} created`)
      after()
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError && err.status === 409
          ? errorText(err, 'This request was already reviewed.')
          : errorText(err)
      )
      after()
    },
  })
  const decline = useMutation({
    mutationFn: () =>
      api(`/payment-submissions/${id}/decline`, {
        method: 'POST',
        body: { reason: reason.trim() },
      }),
    onSuccess: () => {
      toast.success('Declined. The student sees your reason and can send proof again.')
      setDeclining(false)
      after()
    },
    onError: (err) => toast.error(errorText(err)),
  })

  if (req.isPending)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    )
  if (req.isError)
    return (
      <p className="text-sm text-red-700">{errorText(req.error, "Couldn't load this request.")}</p>
    )
  const r = req.data
  const fee = fees.data?.items.find((f) => f.id === r.studentFeeId)
  const overBalance = fee && Number(r.amount) > Number(fee.remainingAmount)
  const pending = r.status === 'PENDING'

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="text-muted flex gap-2 text-[13px]">
        <Link to="/admin/payment-requests" className="hover:text-brand">
          Payment requests
        </Link>
        <span aria-hidden>/</span>
        <span>{r.studentName}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-heading text-[26px] font-semibold">
              {inr(r.amount)} from {r.studentName}
            </h1>
            <Pill tone={REQUEST_STATUS[r.status].tone}>{REQUEST_STATUS[r.status].label}</Pill>
          </span>
          <p className="text-muted text-sm">
            Sent {waited(r.createdAt).toLowerCase()} ·{' '}
            <Link to={`/admin/students/${r.studentId}?tab=fees`} className="text-brand">
              Open student's fees
            </Link>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section className="dt flex min-w-0 flex-[1_1_360px] flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-heading text-[17px] font-semibold">Screenshot</h2>
            <a
              href={r.screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand inline-flex items-center gap-1 text-sm font-medium"
            >
              Open full size <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
          <a
            href={r.screenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
          >
            <img
              src={r.screenshotUrl}
              alt={`Payment screenshot sent by ${r.studentName}`}
              className="mx-auto max-h-130 w-auto object-contain"
            />
          </a>
        </section>

        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
          <section className="dt flex flex-col gap-4 p-5">
            <h2 className="font-display text-heading text-[17px] font-semibold">
              What the student entered
            </h2>
            <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
              <dt className="text-muted">Fee</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <span className="text-heading">{r.feeTitle}</span> <FeeTypeChip type={r.feeType} />
              </dd>
              <dt className="text-muted">Amount</dt>
              <dd className="text-heading font-semibold tabular-nums">{inr(r.amount)}</dd>
              <dt className="text-muted">Method</dt>
              <dd className="text-heading">{METHODS[r.method]}</dd>
              <dt className="text-muted">Paid into</dt>
              <dd className="text-heading">{r.paymentAccountName}</dd>
              <dt className="text-muted">UTR / reference</dt>
              <dd className="text-heading font-mono">{r.referenceNo}</dd>
              <dt className="text-muted">Paid on</dt>
              <dd className="text-heading">{fmtDate(r.paidOn)}</dd>
              {r.note && (
                <>
                  <dt className="text-muted">Note</dt>
                  <dd className="text-heading">{r.note}</dd>
                </>
              )}
              {fee && (
                <>
                  <dt className="text-muted">Fee balance</dt>
                  <dd className="text-heading tabular-nums">
                    {inr(fee.remainingAmount)} of {inr(fee.totalAmount)}
                  </dd>
                </>
              )}
            </dl>
          </section>

          {pending ? (
            <section className="dt flex flex-col gap-4 p-5">
              <h2 className="font-display text-heading text-[17px] font-semibold">
                Check before approving
              </h2>
              {r.utrSeenBefore && (
                <div
                  role="alert"
                  className="flex gap-2.5 rounded-xl bg-red-50 px-3.5 py-3 text-[13px] text-red-800"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  This UTR was already used on another request or payment. Make sure this isn't the
                  same transfer claimed twice.
                </div>
              )}
              {overBalance && (
                <div
                  role="alert"
                  className="flex gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-[13px] text-amber-800"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  The amount is more than the {inr(fee!.remainingAmount)} still due on this fee, so
                  approving will fail. Decline and ask for the right amount.
                </div>
              )}
              {(
                [
                  ['utr', `I found UTR ${r.referenceNo} in the bank statement`],
                  ['amount', `The amount received is ${inr(r.amount)}`],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex cursor-pointer items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="accent-brand mt-0.5 h-4.5 w-4.5"
                    checked={checks[k]}
                    onChange={(e) => setChecks((c) => ({ ...c, [k]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
              <p className="text-muted text-[13px] leading-relaxed">
                Approving creates the payment and its receipt, lowers the balance and shows the
                receipt to the student.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Btn
                  busy={approve.isPending}
                  disabled={!checks.utr || !checks.amount || !!overBalance}
                  onClick={() => approve.mutate()}
                >
                  <Check className="h-4 w-4" aria-hidden /> Approve and create receipt
                </Btn>
                <Btn variant="outline" className="text-red-700" onClick={() => setDeclining(true)}>
                  Decline
                </Btn>
              </div>
            </section>
          ) : (
            <section
              className={`flex flex-col gap-2 rounded-2xl p-5 text-sm ${r.status === 'APPROVED' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}
            >
              <b className="font-display text-base">
                {r.status === 'APPROVED' ? 'Approved' : 'Declined'}
                {r.reviewedAt ? ` on ${fmtDate(r.reviewedAt)}` : ''}
              </b>
              {r.declineReason && <span>Reason: {r.declineReason}</span>}
              {r.feePaymentId && (
                <Link
                  to={`/admin/students/${r.studentId}/receipts/${r.feePaymentId}`}
                  className="inline-flex items-center gap-1.5 font-medium underline"
                >
                  <ReceiptText className="h-4 w-4" aria-hidden /> View receipt
                </Link>
              )}
            </section>
          )}
        </div>
      </div>

      <Dialog
        open={declining}
        onClose={() => setDeclining(false)}
        title="Decline this request?"
        footer={
          <>
            <Btn variant="outline" onClick={() => setDeclining(false)}>
              Cancel
            </Btn>
            <Btn
              variant="danger"
              busy={decline.isPending}
              disabled={!reason.trim()}
              onClick={() => decline.mutate()}
            >
              Decline request
            </Btn>
          </>
        }
      >
        <p>No payment is recorded. The student sees the reason and can send proof again.</p>
        <div className="flex flex-wrap gap-2">
          {DECLINE_REASONS.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setReason(x)}
              className={`min-h-9 rounded-full border px-3 text-[13px] ${reason === x ? 'border-brand bg-tint-blue text-brand' : 'border-border bg-white'}`}
            >
              {x}
            </button>
          ))}
        </div>
        <FieldWrap label="Reason the student will see" htmlFor="decline-reason" required>
          <Input id="decline-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </FieldWrap>
      </Dialog>
    </div>
  )
}
