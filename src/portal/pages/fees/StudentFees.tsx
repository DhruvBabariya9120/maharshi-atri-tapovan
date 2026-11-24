import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Ban, Banknote, Pencil, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { FieldWrap, Input, Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { useYears } from '../../api/lookups'
import { Btn, ConfirmDialog, Dialog, errorText, fmtDate } from '../../ui'
import {
  FEE_TYPES,
  METHODS,
  FeeStatusPill,
  FeeTypeChip,
  MethodChip,
  ProgressBar,
  inr,
  localToday,
  paidPercent,
  type FeeType,
  type Method,
} from './common'

type Fee = Schemas['AdminStudentFeeDto']
type Line = Schemas['AdminFeePaymentLineDto']
const MONEY = /^\d{1,9}(\.\d{1,2})?$/
const today = localToday

export function StudentFees({ studentId, readOnly }: { studentId: string; readOnly?: boolean }) {
  const qc = useQueryClient()
  const years = useYears()
  const summary = useQuery({
    queryKey: ['students', studentId, 'fees'],
    queryFn: () => api<Schemas['AdminStudentFeeSummaryDto']>(`/students/${studentId}/fees`),
  })
  const [paying, setPaying] = useState<Fee | null>(null)
  const [editing, setEditing] = useState<Fee | null>(null)
  const [deleting, setDeleting] = useState<Fee | null>(null)
  const [voiding, setVoiding] = useState<Line | null>(null)
  const [cashOpen, setCashOpen] = useState(false)
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['students', studentId, 'fees'] })
    qc.invalidateQueries({ queryKey: ['fees'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const remove = useMutation({
    mutationFn: (f: Fee) => api(`/fees/${f.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Fee deleted')
      setDeleting(null)
      refresh()
    },
    onError: (err) => {
      setDeleting(null)
      toast.error(errorText(err, 'This fee has payments, so it can’t be deleted.'))
    },
  })

  if (summary.isPending) return <div className="dt h-40 animate-pulse" />
  if (summary.isError)
    return (
      <p className="text-sm text-red-700">
        {errorText(summary.error, "Couldn't load this student's fees.")}
      </p>
    )
  const s = summary.data
  const fees = [...s.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Billed', s.totalAmount, 'text-heading'],
          ['Paid', s.paidAmount, 'text-green-700'],
          [
            'Remaining',
            s.remainingAmount,
            Number(s.remainingAmount) > 0 ? 'text-amber-700' : 'text-heading',
          ],
        ].map(([label, value, tone]) => (
          <div key={label} className="dt flex flex-col gap-1 p-5">
            <span className="text-muted text-[13px]">{label}</span>
            <span className={`font-display text-2xl font-semibold tabular-nums ${tone}`}>
              {inr(value)}
            </span>
          </div>
        ))}
      </div>

      <section className="dt">
        <div className="dt-bar">
          <h2 className="dt-title">
            Fees <span className="dt-count">{fees.length}</span>
          </h2>
          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <Btn
                variant="outline"
                onClick={() => setCashOpen(true)}
                title="Cash taken for something that wasn't billed, e.g. washing or stationery"
              >
                <Banknote className="h-4 w-4" aria-hidden /> Record cash
              </Btn>
              <Link
                to={`/admin/fees/assign?student=${studentId}`}
                className="bg-brand hover:bg-brand-dark inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" aria-hidden /> Add fee
              </Link>
            </div>
          )}
        </div>
        {!fees.length && (
          <p className="text-muted px-6 py-10 text-center text-sm">No fees for this student yet.</p>
        )}
        <ul className="flex flex-col">
          {fees.map((f) => {
            const overdue = f.isOverdue && f.status !== 'PAID'
            return (
              <li
                key={f.id}
                className="flex flex-col gap-3 border-t border-slate-100 px-6 py-5 first:border-t-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <b className="text-heading text-[15px]">{f.title}</b>
                      <FeeTypeChip type={f.feeType} />
                      <FeeStatusPill status={f.status} isOverdue={f.isOverdue} />
                    </span>
                    <span className="text-muted text-[13px]">
                      {years.nameOf(f.academicYearId)}
                      {f.dueDate && (
                        <span className={overdue ? 'font-medium text-red-700' : ''}>
                          {' '}
                          · due {fmtDate(f.dueDate)}
                        </span>
                      )}
                      {f.notes && <> · {f.notes}</>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!readOnly && f.status !== 'PAID' && (
                      <Btn onClick={() => setPaying(f)}>Record payment</Btn>
                    )}
                    {!readOnly && (
                      <div className="ra">
                        <button
                          type="button"
                          aria-label={`Edit ${f.title}`}
                          onClick={() => setEditing(f)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="danger"
                          aria-label={`Delete ${f.title}`}
                          title={
                            f.payments.some((p) => !p.voidedAt)
                              ? 'Void its payments first'
                              : 'Delete'
                          }
                          disabled={f.payments.some((p) => !p.voidedAt)}
                          onClick={() => setDeleting(f)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm tabular-nums">
                  <div className="min-w-48 flex-1">
                    <ProgressBar
                      percent={paidPercent(f)}
                      tone={f.status === 'PAID' ? 'green' : overdue ? 'red' : 'blue'}
                    />
                  </div>
                  <span>
                    <span className="text-muted">Paid</span>{' '}
                    <b className="text-heading">{inr(f.paidAmount)}</b> of {inr(f.totalAmount)}
                  </span>
                  <span>
                    <span className="text-muted">Remaining</span>{' '}
                    <b className="text-heading">{inr(f.remainingAmount)}</b>
                  </span>
                </div>
                {f.payments.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="tbl text-[13px]">
                      <thead>
                        <tr>
                          <th>Receipt</th>
                          <th>Paid on</th>
                          <th>Method</th>
                          <th className="text-right!">Amount</th>
                          <th className="text-right!">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {f.payments.map((p) => (
                          <tr key={p.id} className={p.voidedAt ? 'bg-red-50/40' : undefined}>
                            <td
                              className={`font-mono ${p.voidedAt ? 'text-muted line-through' : ''}`}
                            >
                              {p.voidedAt ? (
                                p.receiptNo
                              ) : (
                                <Link
                                  to={`/admin/students/${studentId}/receipts/${p.id}`}
                                  className="text-brand"
                                >
                                  {p.receiptNo}
                                </Link>
                              )}
                            </td>
                            <td className="whitespace-nowrap">{fmtDate(p.paidOn)}</td>
                            <td>
                              <MethodChip method={p.method} />
                            </td>
                            <td
                              className={`text-right font-semibold whitespace-nowrap ${p.voidedAt ? 'text-muted line-through' : 'text-heading'}`}
                            >
                              {inr(p.amount)}
                            </td>
                            <td>
                              {p.voidedAt ? (
                                <span className="flex flex-col items-end gap-0.5 text-right">
                                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-800 uppercase">
                                    Void
                                  </span>
                                  {p.voidReason && (
                                    <small className="text-muted text-xs">{p.voidReason}</small>
                                  )}
                                </span>
                              ) : (
                                <div className="ra">
                                  <Link
                                    to={`/admin/students/${studentId}/receipts/${p.id}`}
                                    aria-label={`Receipt ${p.receiptNo}`}
                                  >
                                    <ReceiptText className="h-4 w-4" />
                                  </Link>
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      className="danger"
                                      aria-label={`Void ${p.receiptNo}`}
                                      title="Void"
                                      onClick={() => setVoiding(p)}
                                    >
                                      <Ban className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
      <p className="text-muted text-[13px]">
        Payments can't be deleted. Void one with a reason to correct a mistake; voided payments
        don't count as paid.
      </p>

      {paying && (
        <RecordPaymentDialog fee={paying} onClose={() => setPaying(null)} onSaved={refresh} />
      )}
      {editing && (
        <EditFeeDialog fee={editing} onClose={() => setEditing(null)} onSaved={refresh} />
      )}
      {voiding && <VoidDialog line={voiding} onClose={() => setVoiding(null)} onSaved={refresh} />}
      {cashOpen && (
        <CashDialog
          studentId={studentId}
          yearId={years.current?.id ?? ''}
          onClose={() => setCashOpen(false)}
          onSaved={refresh}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.title ?? ''}?`}
        body="The fee is removed from this student. Fees with payments can't be deleted."
        confirmLabel="Delete fee"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  )
}

function RecordPaymentDialog({
  fee,
  onClose,
  onSaved,
}: {
  fee: Fee
  onClose: () => void
  onSaved: () => void
}) {
  const [amount, setAmount] = useState(Number(fee.remainingAmount).toFixed(2))
  const [method, setMethod] = useState<Method>('CASH')
  const [referenceNo, setReferenceNo] = useState('')
  const [paidOn, setPaidOn] = useState(today())
  const [notes, setNotes] = useState('')
  const save = useMutation({
    mutationFn: () =>
      api<Schemas['PaymentsResultDto']>('/payments', {
        method: 'POST',
        body: {
          items: [
            {
              studentFeeId: fee.id,
              amount: Number(amount).toFixed(2),
              paidOn,
              method,
              referenceNo: referenceNo.trim() || undefined,
              notes: notes.trim() || undefined,
            },
          ],
        },
      }),
    onSuccess: (r) => {
      toast.success(`Payment recorded · receipt ${r.items[0]?.receiptNo ?? ''}`)
      onSaved()
      onClose()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const tooMuch = MONEY.test(amount) && Number(amount) > Number(fee.remainingAmount)
  const amountError =
    !MONEY.test(amount) || Number(amount) <= 0
      ? 'Enter an amount like 12000'
      : tooMuch
        ? `At most ${inr(fee.remainingAmount)}, the remaining balance`
        : undefined
  const refLabel =
    method === 'UPI'
      ? 'UPI reference (UTR)'
      : method === 'CHEQUE'
        ? 'Cheque number'
        : method === 'BANK_TRANSFER'
          ? 'Bank reference'
          : 'Reference'

  return (
    <Dialog
      open
      onClose={onClose}
      title="Record payment"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            busy={save.isPending}
            disabled={!!amountError || !paidOn || paidOn > today()}
            onClick={() => save.mutate()}
          >
            Save payment
          </Btn>
        </>
      }
    >
      <p className="text-muted -mt-2">
        {fee.title} · {inr(fee.remainingAmount)} remaining
      </p>
      <FieldWrap label="Amount (₹)" htmlFor="rp-amount" error={amountError}>
        <Input
          id="rp-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[,\s₹]/g, ''))}
          className="text-lg font-semibold tabular-nums"
        />
      </FieldWrap>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-heading mb-2 text-sm font-medium">Method</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(METHODS) as Method[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={method === m}
              onClick={() => setMethod(m)}
              className={`min-h-10 rounded-full border px-4 text-sm font-medium ${method === m ? 'border-brand bg-tint-blue text-brand' : 'border-border text-content bg-white'}`}
            >
              {METHODS[m]}
            </button>
          ))}
        </div>
      </fieldset>
      {method !== 'CASH' && (
        <FieldWrap label={refLabel} htmlFor="rp-ref">
          <Input id="rp-ref" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
        </FieldWrap>
      )}
      <FieldWrap
        label="Paid on"
        htmlFor="rp-date"
        error={paidOn > today() ? "Can't be in the future" : undefined}
      >
        <Input
          id="rp-date"
          type="date"
          max={today()}
          value={paidOn}
          onChange={(e) => setPaidOn(e.target.value)}
        />
      </FieldWrap>
      <FieldWrap label="Note" htmlFor="rp-notes" hint="Optional">
        <Input id="rp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldWrap>
    </Dialog>
  )
}

function EditFeeDialog({
  fee,
  onClose,
  onSaved,
}: {
  fee: Fee
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(fee.title)
  const [feeType, setFeeType] = useState<FeeType>(fee.feeType)
  const [amount, setAmount] = useState(Number(fee.totalAmount).toFixed(2))
  const [dueDate, setDueDate] = useState(fee.dueDate?.slice(0, 10) ?? '')
  const [notes, setNotes] = useState(fee.notes ?? '')
  const save = useMutation({
    mutationFn: () =>
      api(`/fees/${fee.id}`, {
        method: 'PATCH',
        body: {
          title: title.trim(),
          feeType,
          totalAmount: Number(amount).toFixed(2),
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success('Fee saved')
      onSaved()
      onClose()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const belowPaid = MONEY.test(amount) && Number(amount) < Number(fee.paidAmount)
  const amountError =
    !MONEY.test(amount) || Number(amount) <= 0
      ? 'Enter an amount like 45000'
      : belowPaid
        ? `Can't be less than the ${inr(fee.paidAmount)} already paid`
        : undefined
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit ${fee.title}`}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            busy={save.isPending}
            disabled={!!amountError || !title.trim()}
            onClick={() => save.mutate()}
          >
            Save
          </Btn>
        </>
      }
    >
      <FieldWrap label="Name" htmlFor="ef-title">
        <Input id="ef-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </FieldWrap>
      <div className="grid grid-cols-2 gap-3">
        <FieldWrap label="Fee type" htmlFor="ef-type">
          <Select
            id="ef-type"
            value={feeType}
            onChange={(e) => setFeeType(e.target.value as FeeType)}
          >
            {(Object.keys(FEE_TYPES) as FeeType[]).map((t) => (
              <option key={t} value={t}>
                {FEE_TYPES[t]}
              </option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap label="Amount (₹)" htmlFor="ef-amount" error={amountError}>
          <Input
            id="ef-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[,\s₹]/g, ''))}
            className="tabular-nums"
          />
        </FieldWrap>
      </div>
      <FieldWrap label="Due by" htmlFor="ef-due">
        <Input
          id="ef-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </FieldWrap>
      <FieldWrap label="Note" htmlFor="ef-notes">
        <Input id="ef-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldWrap>
    </Dialog>
  )
}

const VOID_REASONS = ['Entered twice', 'Cheque bounced', 'Wrong amount', 'Wrong student or fee']

function VoidDialog({
  line,
  onClose,
  onSaved,
}: {
  line: Line
  onClose: () => void
  onSaved: () => void
}) {
  const [reason, setReason] = useState('')
  const save = useMutation({
    mutationFn: () =>
      api(`/payments/${line.id}/void`, { method: 'POST', body: { reason: reason.trim() } }),
    onSuccess: () => {
      toast.success(`${line.receiptNo} voided`)
      onSaved()
      onClose()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Void ${line.receiptNo}?`}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant="danger"
            busy={save.isPending}
            disabled={!reason.trim()}
            onClick={() => save.mutate()}
          >
            Void payment
          </Btn>
        </>
      }
    >
      <p>
        {inr(line.amount)} paid on {fmtDate(line.paidOn)} stops counting toward this fee. The
        receipt stays in the records, marked void.
      </p>
      <div className="flex flex-wrap gap-2">
        {VOID_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`min-h-9 rounded-full border px-3 text-[13px] ${reason === r ? 'border-brand bg-tint-blue text-brand' : 'border-border bg-white'}`}
          >
            {r}
          </button>
        ))}
      </div>
      <FieldWrap label="Reason" htmlFor="void-reason" required>
        <Input id="void-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </FieldWrap>
    </Dialog>
  )
}

function CashDialog({
  studentId,
  yearId,
  onClose,
  onSaved,
}: {
  studentId: string
  yearId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [feeType, setFeeType] = useState<FeeType>('WASHING')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [paidOn, setPaidOn] = useState(today())
  const [notes, setNotes] = useState('')
  const save = useMutation({
    mutationFn: () =>
      api<Schemas['CashPaymentResultDto']>(`/students/${studentId}/cash-payments`, {
        method: 'POST',
        body: {
          academicYearId: yearId,
          feeType,
          title: title.trim() || FEE_TYPES[feeType],
          amount: Number(amount).toFixed(2),
          paidOn,
          notes: notes.trim() || undefined,
        },
      }),
    onSuccess: (r) => {
      toast.success(`Cash recorded · receipt ${r.payment.receiptNo}`)
      onSaved()
      onClose()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const amountError =
    amount && (!MONEY.test(amount) || Number(amount) <= 0) ? 'Enter an amount like 500' : undefined
  return (
    <Dialog
      open
      onClose={onClose}
      title="Record cash payment"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            busy={save.isPending}
            disabled={!amount || !!amountError || !yearId || !paidOn || paidOn > today()}
            onClick={() => save.mutate()}
          >
            Save and create receipt
          </Btn>
        </>
      }
    >
      <p>
        For cash taken for something that wasn't billed, like washing or stationery. It creates a
        paid fee and its receipt together.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <FieldWrap label="Fee type" htmlFor="cp-type">
          <Select
            id="cp-type"
            value={feeType}
            onChange={(e) => setFeeType(e.target.value as FeeType)}
          >
            {(Object.keys(FEE_TYPES) as FeeType[]).map((t) => (
              <option key={t} value={t}>
                {FEE_TYPES[t]}
              </option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap label="Amount (₹)" htmlFor="cp-amount" error={amountError}>
          <Input
            id="cp-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[,\s₹]/g, ''))}
            className="font-semibold tabular-nums"
          />
        </FieldWrap>
      </div>
      <FieldWrap label="Name" htmlFor="cp-title">
        <Input
          id="cp-title"
          placeholder={FEE_TYPES[feeType]}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FieldWrap>
      <FieldWrap label="Paid on" htmlFor="cp-date">
        <Input
          id="cp-date"
          type="date"
          max={today()}
          value={paidOn}
          onChange={(e) => setPaidOn(e.target.value)}
        />
      </FieldWrap>
      <FieldWrap label="Note" htmlFor="cp-notes" hint="Optional">
        <Input id="cp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FieldWrap>
    </Dialog>
  )
}
