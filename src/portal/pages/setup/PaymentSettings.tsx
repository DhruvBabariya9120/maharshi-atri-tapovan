import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Banknote, ImageUp, Loader2, Pencil, Plus, QrCode, Trash2 } from 'lucide-react'
import { FieldWrap, Input, Textarea } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { checkFile, uploadFile } from '../../api/lookups'
import { Btn, ConfirmDialog, PageHeader, errorText } from '../../ui'
import { FEE_TYPES, type FeeType } from '../fees/common'

// The school can collect into several accounts. Each fee type belongs to at most one
// account; students paying a fee see the account that collects its type. A fee type on
// no account is paid in cash at the office.

type Account = Schemas['PaymentAccountDto']
const TEXT_FIELDS = [
  'name',
  'upiId',
  'payeeName',
  'qrKey',
  'bankAccountName',
  'bankAccountNo',
  'ifsc',
  'bankBranch',
  'instructions',
] as const
type TextField = (typeof TEXT_FIELDS)[number]
type Form = Record<TextField, string> & { feeTypes: FeeType[] }

const ALL_TYPES = Object.keys(FEE_TYPES) as FeeType[]
const toForm = (a?: Account): Form => ({
  name: a?.name ?? '',
  upiId: a?.upiId ?? '',
  payeeName: a?.payeeName ?? '',
  qrKey: a?.qrKey ?? '',
  bankAccountName: a?.bankAccountName ?? '',
  bankAccountNo: a?.bankAccountNo ?? '',
  ifsc: a?.ifsc ?? '',
  bankBranch: a?.bankBranch ?? '',
  instructions: a?.instructions ?? '',
  feeTypes: a?.feeTypes ?? [],
})

export function PaymentSettings() {
  const qc = useQueryClient()
  const accounts = useQuery({
    queryKey: ['payment-accounts'],
    queryFn: () => api<Account[]>('/payment-accounts'),
  })
  const [editing, setEditing] = useState<Account | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Account | null>(null)
  const remove = useMutation({
    mutationFn: (a: Account) => api<void>(`/payment-accounts/${a.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Account deleted')
      setDeleting(null)
      qc.invalidateQueries({ queryKey: ['payment-accounts'] })
    },
    onError: (err) => toast.error(errorText(err)),
  })

  const list = accounts.data ?? []
  const ownerOf = (t: FeeType) => list.find((a) => a.feeTypes.includes(t))

  if (editing)
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow="Setup · Payment accounts"
          title={editing === 'new' ? 'Add payment account' : `Edit ${editing.name}`}
        />
        <AccountForm
          initial={editing === 'new' ? undefined : editing}
          others={list.filter((a) => editing === 'new' || a.id !== editing.id)}
          onDone={() => setEditing(null)}
        />
      </div>
    )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Setup"
        title="Payment accounts"
        sub="Each account collects some fee types. A student paying a fee sees the QR and bank details of the account that collects it. Changes show to students straight away."
        actions={
          <Btn onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden /> Add account
          </Btn>
        }
      />

      {accounts.isPending ? (
        <div className="dt h-60 animate-pulse" />
      ) : accounts.isError ? (
        <p className="text-sm text-red-700">
          {errorText(accounts.error, "Couldn't load the payment accounts.")}
        </p>
      ) : (
        <>
          <section className="dt flex flex-col gap-3 p-5">
            <h2 className="font-display text-heading text-[15px] font-semibold">
              Where each fee is paid
            </h2>
            <ul className="flex flex-wrap gap-2">
              {ALL_TYPES.map((t) => {
                const a = ownerOf(t)
                return (
                  <li
                    key={t}
                    className={`flex flex-col rounded-xl border px-3 py-1.5 text-xs ${a ? 'border-border bg-white' : 'border-amber-200 bg-amber-50'}`}
                  >
                    <b className="text-heading text-[13px]">{FEE_TYPES[t]}</b>
                    <span className={a ? 'text-muted' : 'text-amber-800'}>
                      {a ? a.name : 'Cash at the office'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          {!list.length && (
            <div className="bg-tint-blue-soft rounded-2xl border border-dashed border-blue-200 px-6 py-14 text-center">
              <Banknote className="text-brand mx-auto mb-3 h-8 w-8" aria-hidden />
              <p className="font-display text-heading text-lg font-semibold">No accounts yet</p>
              <p className="text-muted mt-1 text-sm">
                Until you add one, students can only pay fees in cash at the office.
              </p>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {list.map((a) => (
              <article key={a.id} className="dt flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="font-display text-heading text-[17px] font-semibold">
                      {a.name}
                    </h2>
                    <span className="flex flex-wrap gap-1.5">
                      {a.feeTypes.length ? (
                        a.feeTypes.map((t) => (
                          <span
                            key={t}
                            className="bg-tint-blue-soft text-brand rounded-md px-2 py-0.5 text-[11px] font-semibold"
                          >
                            {FEE_TYPES[t]}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-amber-800">
                          No fee types: hidden from students
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      aria-label={`Edit ${a.name}`}
                      onClick={() => setEditing(a)}
                      className="border-border hover:border-brand hover:text-brand grid h-9 w-9 place-items-center rounded-lg border bg-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={
                        a.feeTypes.length
                          ? `${a.name} still collects fees and can't be deleted`
                          : `Delete ${a.name}`
                      }
                      title={
                        a.feeTypes.length
                          ? 'Remove its fee types (or move them to another account) first'
                          : undefined
                      }
                      disabled={a.feeTypes.length > 0}
                      onClick={() => setDeleting(a)}
                      className="border-border grid h-9 w-9 place-items-center rounded-lg border bg-white text-red-700 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-start gap-4 text-sm">
                  <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {a.qrUrl ? (
                      <img
                        src={a.qrUrl}
                        alt={`${a.name} UPI QR`}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <QrCode className="h-7 w-7 text-slate-300" aria-label="No QR" />
                    )}
                  </div>
                  <dl className="grid min-w-0 flex-1 grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-1">
                    <dt className="text-muted">UPI ID</dt>
                    <dd className="text-heading truncate">{a.upiId ?? '—'}</dd>
                    <dt className="text-muted">Account</dt>
                    <dd className="text-heading truncate">
                      {a.bankAccountNo ? `${a.bankAccountName ?? ''} · ${a.bankAccountNo}` : '—'}
                    </dd>
                    <dt className="text-muted">IFSC</dt>
                    <dd className="text-heading">{a.ifsc ?? '—'}</dd>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'account'}?`}
        body="Students no longer see it. Past payments and receipts keep the account's details."
        confirmLabel="Delete account"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  )
}

const UPI = /^[\w.-]{2,}@[a-zA-Z]{2,}$/
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/
const ACCOUNT = /^\d{9,18}$/

function AccountForm({
  initial,
  others,
  onDone,
}: {
  initial?: Account
  others: Account[]
  onDone: () => void
}) {
  const qc = useQueryClient()
  const saved = toForm(initial)
  const [form, setForm] = useState<Form>(saved)
  const [qrPreview, setQrPreview] = useState<string | null>(initial?.qrUrl ?? null)
  const fileInput = useRef<HTMLInputElement>(null)
  const set = (k: TextField) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const takenBy = (t: FeeType) => others.find((a) => a.feeTypes.includes(t))
  const toggleType = (t: FeeType) =>
    setForm((f) => ({
      ...f,
      feeTypes: f.feeTypes.includes(t) ? f.feeTypes.filter((x) => x !== t) : [...f.feeTypes, t],
    }))

  const uploadQr = useMutation({
    mutationFn: (file: File) => uploadFile(file, 'PAYMENT_QR'),
    onSuccess: (key, file) => {
      setForm((f) => ({ ...f, qrKey: key }))
      setQrPreview(URL.createObjectURL(file))
      toast.success('QR uploaded. Save to show it to students.')
    },
    onError: (err) => toast.error(errorText(err, (err as Error).message)),
  })

  const clean = (k: TextField) => (k === 'ifsc' ? form.ifsc.trim().toUpperCase() : form[k].trim())
  const save = useMutation({
    mutationFn: () => {
      // Only send what's filled in (create) or changed (update): the API rejects empty strings.
      const body: Record<string, unknown> = {}
      TEXT_FIELDS.forEach((k) => {
        const v = clean(k)
        if (v && (!initial || v !== saved[k].trim())) body[k] = v
      })
      if (!initial || form.feeTypes.join() !== saved.feeTypes.join()) body.feeTypes = form.feeTypes
      return initial
        ? api<Account>(`/payment-accounts/${initial.id}`, { method: 'PATCH', body })
        : api<Account>('/payment-accounts', { method: 'POST', body })
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['payment-accounts'] })
      toast.success(initial ? `${a.name} saved` : `Added ${a.name}`)
      onDone()
    },
    onError: (err) => toast.error(errorText(err)),
  })

  // A saved value can't be removed (the API has no "clear"); it can only be changed.
  const cleared = (k: TextField) => !!saved[k].trim() && !form[k].trim()
  const keep = 'Saved details can be changed but not removed'
  const errors: Partial<Record<TextField | 'feeTypes' | 'pay', string>> = {
    name: !form.name.trim() ? 'Give the account a name' : undefined,
    upiId: cleared('upiId')
      ? keep
      : form.upiId && !UPI.test(form.upiId.trim())
        ? 'Looks like name@bank'
        : undefined,
    payeeName: cleared('payeeName') ? keep : undefined,
    bankAccountName: cleared('bankAccountName') ? keep : undefined,
    bankAccountNo: cleared('bankAccountNo')
      ? keep
      : form.bankAccountNo && !ACCOUNT.test(form.bankAccountNo.trim())
        ? '9 to 18 digits'
        : undefined,
    ifsc: cleared('ifsc')
      ? keep
      : form.ifsc && !IFSC.test(form.ifsc.trim().toUpperCase())
        ? '11 characters, like SBIN0001234'
        : undefined,
    bankBranch: cleared('bankBranch') ? keep : undefined,
    instructions: cleared('instructions') ? keep : undefined,
    feeTypes: !initial && !form.feeTypes.length ? 'Pick at least one fee type' : undefined,
    pay:
      !form.upiId.trim() &&
      !(form.bankAccountName.trim() && form.bankAccountNo.trim() && form.ifsc.trim())
        ? 'Add a UPI ID, or the account name, number and IFSC'
        : undefined,
  }
  const hasError = Object.values(errors).some(Boolean)

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-5">
        <section className="dt flex flex-col gap-4 p-5 sm:p-6">
          <FieldWrap label="Account name" htmlFor="pa-name" required error={errors.name}>
            <Input
              id="pa-name"
              placeholder="e.g. Tuition account"
              value={form.name}
              onChange={set('name')}
            />
          </FieldWrap>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-heading mb-1 text-sm font-medium">
              Fees paid into this account
            </legend>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map((t) => {
                const other = takenBy(t)
                const on = form.feeTypes.includes(t)
                return (
                  <label
                    key={t}
                    title={other ? `Collected by ${other.name}` : undefined}
                    className={`flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm ${other ? 'cursor-not-allowed border-slate-200 text-slate-400' : on ? 'border-brand bg-tint-blue-soft text-brand cursor-pointer' : 'border-border cursor-pointer bg-white'}`}
                  >
                    <input
                      type="checkbox"
                      className="accent-brand h-4 w-4"
                      checked={on}
                      disabled={!!other}
                      onChange={() => toggleType(t)}
                    />
                    {FEE_TYPES[t]}
                    {other && <span className="text-xs">· {other.name}</span>}
                  </label>
                )
              })}
            </div>
            <span className={`text-xs ${errors.feeTypes ? 'text-red-700' : 'text-muted'}`}>
              {errors.feeTypes ??
                'A fee type can be on one account only. To move one, untick it on its current account first.'}
            </span>
          </fieldset>
        </section>

        <section className="dt flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="font-display text-heading text-[17px] font-semibold">UPI</h2>
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex flex-col items-center gap-2.5">
              <div className="grid h-44 w-44 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                {uploadQr.isPending ? (
                  <Loader2 className="text-brand h-7 w-7 animate-spin" />
                ) : qrPreview ? (
                  <img
                    src={qrPreview}
                    alt="UPI QR code"
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-muted flex flex-col items-center gap-1.5 text-xs">
                    <QrCode className="h-8 w-8 text-slate-300" aria-hidden /> No QR yet
                  </span>
                )}
              </div>
              <Btn
                variant="outline"
                onClick={() => fileInput.current?.click()}
                disabled={uploadQr.isPending}
              >
                <ImageUp className="h-4 w-4" aria-hidden /> {qrPreview ? 'Replace QR' : 'Upload QR'}
              </Btn>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (!f) return
                  const problem = checkFile(f, 'PAYMENT_QR')
                  if (problem) toast.error(problem)
                  else uploadQr.mutate(f)
                }}
              />
            </div>
            <div className="grid min-w-60 flex-1 gap-4">
              <FieldWrap label="UPI ID" htmlFor="ps-upi" error={errors.upiId}>
                <Input
                  id="ps-upi"
                  placeholder="school@bank"
                  value={form.upiId}
                  onChange={set('upiId')}
                  error={errors.upiId}
                />
              </FieldWrap>
              <FieldWrap
                label="Payee name shown in UPI apps"
                htmlFor="ps-payee"
                error={errors.payeeName}
              >
                <Input id="ps-payee" value={form.payeeName} onChange={set('payeeName')} />
              </FieldWrap>
            </div>
          </div>
          <span className="text-muted text-xs">
            Use the QR from the school's bank or UPI merchant account. PNG, JPG or WebP, up to 2 MB.
          </span>
        </section>

        <section className="dt flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="font-display text-heading text-[17px] font-semibold">
            Bank transfer (NEFT / IMPS / RTGS)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldWrap label="Account name" htmlFor="ps-an" error={errors.bankAccountName}>
              <Input id="ps-an" value={form.bankAccountName} onChange={set('bankAccountName')} />
            </FieldWrap>
            <FieldWrap label="Account number" htmlFor="ps-ac" error={errors.bankAccountNo}>
              <Input
                id="ps-ac"
                inputMode="numeric"
                value={form.bankAccountNo}
                onChange={set('bankAccountNo')}
                error={errors.bankAccountNo}
              />
            </FieldWrap>
            <FieldWrap label="IFSC" htmlFor="ps-ifsc" error={errors.ifsc}>
              <Input
                id="ps-ifsc"
                className="uppercase"
                value={form.ifsc}
                onChange={set('ifsc')}
                error={errors.ifsc}
              />
            </FieldWrap>
            <FieldWrap label="Bank and branch" htmlFor="ps-branch" error={errors.bankBranch}>
              <Input id="ps-branch" value={form.bankBranch} onChange={set('bankBranch')} />
            </FieldWrap>
          </div>
        </section>

        <section className="dt flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="font-display text-heading text-[17px] font-semibold">
            Instructions for students
          </h2>
          <Textarea
            aria-label="Instructions for students"
            rows={4}
            placeholder="Write the student's admission number in the payment note. After paying, upload the screenshot with the UTR number."
            value={form.instructions}
            onChange={set('instructions')}
          />
          {errors.instructions && (
            <span className="text-xs text-red-700">{errors.instructions}</span>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {errors.pay && <span className="text-sm text-amber-800">{errors.pay}</span>}
          <Btn variant="outline" onClick={onDone}>
            Cancel
          </Btn>
          <Btn
            busy={save.isPending}
            disabled={hasError || uploadQr.isPending}
            onClick={() => save.mutate()}
          >
            {initial ? 'Save account' : 'Add account'}
          </Btn>
        </div>
      </div>

      <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5 rounded-2xl bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        <b className="font-display text-base">Before saving</b>
        <span>
          Send ₹1 to the new QR and the new account yourself, and check that it arrives. A wrong
          digit sends parents' money somewhere else.
        </span>
        <span>Every change is saved in the activity log.</span>
      </aside>
    </div>
  )
}
