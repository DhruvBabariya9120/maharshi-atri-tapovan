import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Printer } from 'lucide-react'
import logo from '../../../assets/logo-256.png'
import { contact, site } from '../../../data/site'
import { api, type Schemas } from '../../api/client'
import { Btn, errorText, fmtDate } from '../../ui'
import { FEE_TYPES, METHODS, amountInWords, inr, type FeeType, type Method } from './common'

type ReceiptData = {
  receiptNo: string
  paidOn: string
  amount: string
  method: Method
  referenceNo?: string | null
  voidedAt?: string | null
  voidReason?: string | null
  studentName: string
  admissionNo: string
  className?: string
  yearName: string
  feeTitle: string
  feeType: FeeType
  feeTotal: string
  feePaid: string
  feeRemaining: string
}

/** The API's receipt (one call, class and year included) in the shape the page prints. */
const toReceipt = (r: Schemas['ReceiptDto'] & { voidReason?: string | null }): ReceiptData => ({
  receiptNo: r.receiptNo,
  paidOn: r.paidOn,
  amount: r.amount,
  method: r.method,
  referenceNo: r.referenceNo,
  voidedAt: r.voidedAt,
  voidReason: r.voidReason,
  studentName: r.studentName,
  admissionNo: r.admissionNo,
  className: r.className ?? undefined,
  yearName: r.academicYearName,
  feeTitle: r.feeTitle,
  feeType: r.feeType,
  feeTotal: r.feeTotalAmount,
  feePaid: r.paidToDate,
  feeRemaining: r.balance,
})

export function AdminReceipt() {
  const { id = '', paymentId = '' } = useParams()
  const receipt = useQuery({
    queryKey: ['payments', paymentId],
    queryFn: () => api<Schemas['AdminReceiptDto']>(`/payments/${paymentId}`),
  })
  return (
    <ReceiptPage
      back={`/admin/students/${id}?tab=fees`}
      backLabel="Back to fees"
      data={receipt.data ? toReceipt(receipt.data) : null}
      error={receipt.error}
    />
  )
}

export function MyReceipt() {
  const { paymentId = '' } = useParams()
  const receipt = useQuery({
    queryKey: ['me', 'payments', paymentId],
    queryFn: () => api<Schemas['ReceiptDto']>(`/me/payments/${paymentId}`),
  })
  return (
    <ReceiptPage
      back="/me/fees"
      backLabel="Back to my fees"
      data={receipt.data ? toReceipt(receipt.data) : null}
      error={receipt.error}
    />
  )
}

function ReceiptPage({
  back,
  backLabel,
  data,
  error,
}: {
  back: string
  backLabel: string
  data: ReceiptData | null
  error: unknown
}) {
  if (error)
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-700">
          {errorText(error, "Couldn't load this receipt. It may have been removed.")}
        </p>
        <Link to={back} className="text-brand text-sm font-medium">
          {backLabel}
        </Link>
      </div>
    )
  if (!data)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    )

  const voided = !!data.voidedAt
  return (
    <div className="mx-auto flex w-full max-w-160 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={back} className="text-brand inline-flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {backLabel}
        </Link>
        <Btn onClick={() => window.print()} disabled={voided}>
          <Printer className="h-4 w-4" aria-hidden /> Print or save as PDF
        </Btn>
      </div>

      <article
        aria-label={`Receipt ${data.receiptNo}`}
        className="relative flex flex-col gap-6 overflow-hidden rounded-md border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.3)] sm:p-10 print:border-0 print:p-0 print:shadow-none"
      >
        {voided && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-xl border-4 border-red-600/60 px-6 py-1 text-6xl font-black tracking-widest text-red-600/60"
          >
            VOID
          </span>
        )}
        <header className="border-brand-dark flex flex-wrap items-start justify-between gap-4 border-b-2 pb-5">
          <div className="flex items-center gap-3.5">
            <img src={logo} alt="" className="h-14 w-14 rounded-full" />
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-brand-dark text-lg font-bold">{site.name}</span>
              <span className="text-muted max-w-80 text-xs leading-snug">{contact.address}</span>
              <span className="text-muted text-xs">
                {contact.schoolOffice} · {contact.email}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <h1 className="text-accent-ink text-[11px] font-semibold tracking-[0.12em] uppercase">
              Fee receipt
            </h1>
            <span className="text-heading font-mono text-base font-semibold">{data.receiptNo}</span>
            <span className="text-muted text-[13px]">{fmtDate(data.paidOn)}</span>
          </div>
        </header>

        <dl className="grid grid-cols-[150px_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
          <dt className="text-muted">Received from</dt>
          <dd className="text-heading">{data.studentName}</dd>
          <dt className="text-muted">Admission no.</dt>
          <dd className="text-heading font-mono">{data.admissionNo}</dd>
          {/* The student's API has no class for a fee, so their receipt can only show the year. */}
          {(data.className || data.yearName) && (
            <>
              <dt className="text-muted">{data.className ? 'Class' : 'Academic year'}</dt>
              <dd className="text-heading">
                {[data.className, data.yearName].filter(Boolean).join(' · ')}
              </dd>
            </>
          )}
          <dt className="text-muted">Towards</dt>
          <dd className="text-heading">
            {data.feeTitle} <span className="text-muted">({FEE_TYPES[data.feeType]})</span>
          </dd>
          <dt className="text-muted">Method</dt>
          <dd className="text-heading">
            {METHODS[data.method]}
            {data.referenceNo && <span className="font-mono"> · {data.referenceNo}</span>}
          </dd>
        </dl>

        <div className="bg-tint-blue-soft flex flex-col gap-1.5 rounded-xl px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="text-brand-dark text-sm font-medium">Amount received</span>
            <span
              className={`font-display text-brand-dark text-3xl font-bold tabular-nums ${voided ? 'line-through' : ''}`}
            >
              {inr(data.amount)}
            </span>
          </div>
          <span className="text-content text-[13px]">{amountInWords(data.amount)}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-[13px] tabular-nums">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted">Fee amount</span>
            <b className="text-heading">{inr(data.feeTotal)}</b>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted">Paid so far</span>
            <b className="text-heading">{inr(data.feePaid)}</b>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted">Balance today</span>
            <b className="text-heading">{inr(data.feeRemaining)}</b>
          </div>
        </div>

        {voided && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-800">
            This payment was voided on {fmtDate(data.voidedAt!)}
            {data.voidReason ? `: ${data.voidReason}` : ''}. It doesn't count toward the fee.
          </p>
        )}

        <footer className="flex flex-wrap items-end justify-between gap-4 pt-6">
          <span className="text-muted text-xs">Computer-generated receipt.</span>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-40 border-t border-slate-400" />
            <span className="text-muted text-xs">Authorised signatory</span>
          </div>
        </footer>
      </article>
    </div>
  )
}
