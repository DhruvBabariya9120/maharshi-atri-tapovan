import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Copy, ImageUp, Loader2, QrCode } from 'lucide-react'
import { FieldWrap, Input } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { checkFile, uploadFile } from '../../api/lookups'
import { Btn, errorText, fmtDate } from '../../ui'
import { FeeTypeChip, inr, localToday } from '../fees/common'

type SubMethod = Schemas['CreatePaymentSubmissionDto']['method']
const MONEY = /^\d{1,9}(\.\d{1,2})?$/
const today = localToday

function CopyRow({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 py-2.5 text-sm">
      <span className="flex min-w-0 flex-col">
        <span className="text-muted text-xs">{label}</span>
        <b className="text-heading truncate font-mono">{value}</b>
      </span>
      <button
        type="button"
        aria-label={`Copy ${label}`}
        onClick={() =>
          navigator.clipboard.writeText(value).then(
            () => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            },
            () => toast.error('Copy failed. Select the text instead.')
          )
        }
        className="text-brand hover:bg-tint-blue-soft inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[13px] font-semibold"
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="dt flex min-w-0 flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="bg-brand grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold text-white">
          {n}
        </span>
        <h2 className="font-display text-heading text-[17px] font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function PayFee() {
  const { feeId = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<Schemas['MeDto']>('/me') })
  const fees = useQuery({
    queryKey: ['me', 'fees'],
    queryFn: () => api<Schemas['StudentFeeSummaryDto']>('/me/fees'),
  })
  const accounts = useQuery({
    queryKey: ['me', 'payment-accounts'],
    queryFn: () => api<Schemas['MyPaymentAccountDto'][]>('/me/payment-accounts'),
  })
  const sent = useQuery({
    queryKey: ['me', 'payment-submissions'],
    queryFn: () => api<Schemas['MyPaymentSubmissionDto'][]>('/me/payment-submissions'),
  })
  const fee = fees.data?.items.find((f) => f.id === feeId)
  // Each fee type is collected by at most one account; none means "pay cash at the office".
  const p = fee && accounts.data?.find((a) => a.feeTypes.includes(fee.feeType))
  // The API counts proofs still being checked against the balance, so the most a student
  // can claim now is the remaining amount minus those.
  const pending = (sent.data ?? [])
    .filter((s) => s.studentFeeId === feeId && s.status === 'PENDING')
    .reduce((sum, s) => sum + Number(s.amount), 0)
  const payable = fee ? Math.max(0, Number(fee.remainingAmount) - pending).toFixed(2) : '0.00'

  const [method, setMethod] = useState<SubMethod>('UPI')
  // null = untouched, so the field starts at the remaining balance but can still be emptied
  const [amount, setAmount] = useState<string | null>(null)
  const [paidOn, setPaidOn] = useState(today())
  const [utr, setUtr] = useState('')
  const [note, setNote] = useState('')
  const [shot, setShot] = useState<File | null>(null)
  const shotInput = useRef<HTMLInputElement>(null)

  const submit = useMutation({
    mutationFn: async () => {
      const screenshotKey = await uploadFile(shot!, 'PAYMENT_SCREENSHOT')
      return api<Schemas['MyPaymentSubmissionDto']>(`/me/fees/${feeId}/payment-submissions`, {
        method: 'POST',
        body: {
          amount: Number(amount ?? payable).toFixed(2),
          method,
          paymentAccountId: p!.id,
          referenceNo: utr.trim(),
          paidOn,
          screenshotKey,
          note: note.trim() || undefined,
        },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'payment-submissions'] })
      toast.success(
        'Sent. The office checks it against the bank statement, then your balance updates.'
      )
      navigate('/me/fees')
    },
    onError: (err) => toast.error(errorText(err, (err as Error).message)),
  })

  if (fees.isPending || accounts.isPending || sent.isPending)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    )
  if (fees.isError || !fee)
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-700">
          {errorText(fees.error, "We couldn't find this fee.")}
        </p>
        <Link to="/me/fees" className="text-brand text-sm font-medium">
          Back to my fees
        </Link>
      </div>
    )
  const admissionNo = me.data?.student?.admissionNo
  const amt = amount ?? payable
  const amountError =
    !MONEY.test(amt) || Number(amt) <= 0
      ? 'Enter the amount you paid'
      : Number(amt) > Number(payable)
        ? pending
          ? `At most ${inr(payable)}: ${inr(pending)} you sent earlier is still being checked`
          : `At most ${inr(payable)}`
        : undefined
  const utrError =
    utr && !/^[A-Za-z0-9 -]{6,30}$/.test(utr.trim())
      ? 'Copy the UTR or reference exactly from your app or bank'
      : undefined
  const ready = !amountError && !utrError && utr.trim() && shot && paidOn && paidOn <= today()

  if (fee.status === 'PAID')
    return (
      <div className="dt flex flex-col items-start gap-3 p-6">
        <b className="font-display text-heading text-lg">{fee.title} is fully paid.</b>
        <Link to="/me/fees" className="text-brand text-sm font-medium">
          Back to my fees
        </Link>
      </div>
    )

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="text-muted flex gap-2 text-[13px]">
        <Link to="/me/fees" className="hover:text-brand">
          My fees
        </Link>
        <span aria-hidden>/</span>
        <span>Pay {fee.title}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-heading text-[26px] font-semibold">Pay {fee.title}</h1>
          <span className="text-muted flex flex-wrap items-center gap-2 text-sm">
            <FeeTypeChip type={fee.feeType} /> {inr(fee.paidAmount)} paid of {inr(fee.totalAmount)}
            {fee.dueDate && <> · due {fmtDate(fee.dueDate)}</>}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[13px] text-amber-700">Still to pay</span>
          <span className="font-display text-[28px] font-bold text-amber-700 tabular-nums">
            {inr(fee.remainingAmount)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[1_1_380px]">
          <Step n={1} title="Pay the school">
            {accounts.isError ? (
              <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
                {errorText(accounts.error, "We couldn't load the school's payment details.")} Try
                again, or pay at the school office.
              </p>
            ) : !p ? (
              <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
                This fee is paid in cash at the school office. The school hasn't set up online
                payment for it.
              </p>
            ) : (
              <>
                <span className="text-muted text-xs">
                  Paying into <b className="text-heading">{p.name}</b>
                </span>
                {(p.qrUrl || p.upiId) && (
                  <div className="flex flex-wrap items-center gap-5">
                    <div className="grid h-44 w-44 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {p.qrUrl ? (
                        <img
                          src={p.qrUrl}
                          alt="School UPI QR code"
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <QrCode className="h-10 w-10 text-slate-300" aria-hidden />
                      )}
                    </div>
                    <div className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm">
                      <b className="text-heading">Scan with any UPI app</b>
                      <span>
                        Pay <b className="text-heading">{inr(payable)}</b> or less
                        {admissionNo && (
                          <>
                            , and write <b className="text-heading font-mono">{admissionNo}</b> in
                            the note
                          </>
                        )}
                        .
                      </span>
                      {p.payeeName && (
                        <span className="text-muted text-xs">Paying to {p.payeeName}</span>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex flex-col">
                  <CopyRow label="UPI ID" value={p.upiId} />
                  {p.bankAccountNo && (
                    <div className="text-heading border-t border-slate-100 pt-3.5 pb-1 text-[13px] font-semibold">
                      Or bank transfer
                    </div>
                  )}
                  <CopyRow label="Account name" value={p.bankAccountName} />
                  <CopyRow label="Account number" value={p.bankAccountNo} />
                  <CopyRow label="IFSC" value={p.ifsc} />
                  {p.bankBranch && (
                    <div className="border-t border-slate-100 py-2.5 text-sm">
                      <span className="text-muted block text-xs">Bank</span>
                      <b className="text-heading">{p.bankBranch}</b>
                    </div>
                  )}
                </div>
                {p.instructions && (
                  <p className="bg-tint-blue-soft text-content rounded-xl px-3.5 py-3 text-[13px] leading-relaxed">
                    {p.instructions}
                  </p>
                )}
              </>
            )}
          </Step>
        </div>

        {p && Number(payable) <= 0 && (
          <div className="dt flex min-w-0 flex-[1_1_420px] flex-col gap-2 p-6 text-sm">
            <b className="font-display text-heading text-lg">Already being checked</b>
            <span>
              {inr(pending)} you sent for this fee is still being checked by the office. You can
              send another payment once it's approved or declined.
            </span>
            <Link to="/me/fees" className="text-brand font-medium">
              Back to my fees
            </Link>
          </div>
        )}
        {p && Number(payable) > 0 && (
          <form
            noValidate
            className="flex min-w-0 flex-[1_1_420px]"
            onSubmit={(e) => {
              e.preventDefault()
              if (ready && !submit.isPending) submit.mutate()
            }}
          >
            <Step n={2} title="Tell us you paid">
              <fieldset className="flex flex-col gap-2">
                <legend className="text-heading mb-2 text-sm font-medium">How did you pay?</legend>
                <div className="flex gap-2">
                  {(['UPI', 'BANK_TRANSFER'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={method === m}
                      onClick={() => setMethod(m)}
                      className={`min-h-11 rounded-full border px-5 text-sm font-medium ${method === m ? 'border-brand bg-tint-blue text-brand' : 'border-border text-content bg-white'}`}
                    >
                      {m === 'UPI' ? 'UPI' : 'Bank transfer'}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldWrap label="Amount paid (₹)" htmlFor="pf-amount" error={amountError}>
                  <Input
                    id="pf-amount"
                    inputMode="decimal"
                    value={amt}
                    onChange={(e) => setAmount(e.target.value.replace(/[,\s₹]/g, ''))}
                    className="font-semibold tabular-nums"
                  />
                </FieldWrap>
                <FieldWrap
                  label="Paid on"
                  htmlFor="pf-date"
                  error={paidOn > today() ? "Can't be in the future" : undefined}
                >
                  <Input
                    id="pf-date"
                    type="date"
                    max={today()}
                    value={paidOn}
                    onChange={(e) => setPaidOn(e.target.value)}
                  />
                </FieldWrap>
              </div>
              <FieldWrap
                label={method === 'UPI' ? 'UTR / transaction ID' : 'Bank reference (UTR)'}
                htmlFor="pf-utr"
                required
                hint={
                  method === 'UPI'
                    ? "The 12-digit number in your UPI app's payment details."
                    : 'Shown in your bank app or SMS after the transfer.'
                }
                error={utrError}
              >
                <Input
                  id="pf-utr"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="font-mono"
                />
              </FieldWrap>
              <div className="flex flex-col gap-1.5">
                <span className="text-heading text-sm font-medium">
                  Screenshot of the payment <span className="text-accent-strong">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => shotInput.current?.click()}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left ${shot ? 'border-green-200 bg-green-50' : 'bg-tint-blue-soft border-dashed border-blue-300'}`}
                >
                  <ImageUp
                    className={`h-6 w-6 shrink-0 ${shot ? 'text-green-700' : 'text-brand'}`}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-col text-[13px]">
                    <b className="text-heading truncate">
                      {shot ? shot.name : 'Choose the screenshot'}
                    </b>
                    <span className={shot ? 'text-green-800' : 'text-muted'}>
                      {shot
                        ? `${Math.max(1, Math.round(shot.size / 1024))} KB · ready to send · tap to change`
                        : 'JPG, PNG or WebP, up to 5 MB'}
                    </span>
                  </span>
                </button>
                <input
                  ref={shotInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (!f) return
                    const problem = checkFile(f, 'PAYMENT_SCREENSHOT')
                    if (problem) toast.error(problem)
                    else setShot(f)
                  }}
                />
              </div>
              <FieldWrap
                label="Note for the office"
                htmlFor="pf-note"
                hint="Optional, e.g. paid from father's account"
              >
                <Input id="pf-note" value={note} onChange={(e) => setNote(e.target.value)} />
              </FieldWrap>
              <Btn type="submit" busy={submit.isPending} disabled={!ready} className="min-h-12">
                Send for checking
              </Btn>
              <p className="text-muted text-[13px]">
                The office checks it against the bank statement, usually within 2 working days. Your
                balance updates once it's approved.
              </p>
            </Step>
          </form>
        )}
      </div>
    </div>
  )
}
