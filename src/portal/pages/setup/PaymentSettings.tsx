import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImageUp, Loader2, QrCode } from 'lucide-react'
import { FieldWrap, Input, Textarea } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { checkFile, uploadFile } from '../../api/lookups'
import { Btn, PageHeader, errorText } from '../../ui'

type Settings = Schemas['PaymentSettingsDto']
type Form = Required<{ [K in keyof Schemas['UpdatePaymentSettingsDto']]: string }>

const toForm = (s?: Settings): Form => ({
  upiId: s?.upiId ?? '',
  payeeName: s?.payeeName ?? '',
  qrKey: s?.qrKey ?? '',
  bankAccountName: s?.bankAccountName ?? '',
  bankAccountNo: s?.bankAccountNo ?? '',
  ifsc: s?.ifsc ?? '',
  bankBranch: s?.bankBranch ?? '',
  instructions: s?.instructions ?? '',
})

export function PaymentSettings() {
  const settings = useQuery({
    queryKey: ['payment-settings'],
    queryFn: () => api<Settings>('/payment-settings'),
  })
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Setup"
        title="Payment details"
        sub="Students see this QR code and bank account on every fee with money due. Changes show to students straight away."
      />
      {settings.isPending ? (
        <div className="dt h-60 animate-pulse" />
      ) : settings.isError ? (
        <p className="text-sm text-red-700">
          {errorText(settings.error, "Couldn't load the payment details.")}
        </p>
      ) : (
        <SettingsForm initial={settings.data} />
      )}
    </div>
  )
}

const UPI = /^[\w.-]{2,}@[a-zA-Z]{2,}$/
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/
const ACCOUNT = /^\d{9,18}$/

function SettingsForm({ initial }: { initial: Settings }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Form>(toForm(initial))
  const [qrPreview, setQrPreview] = useState<string | null>(initial.qrUrl)
  const fileInput = useRef<HTMLInputElement>(null)
  const set = (k: keyof Form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const uploadQr = useMutation({
    mutationFn: (file: File) => uploadFile(file, 'PAYMENT_QR'),
    onSuccess: (key, file) => {
      setForm((f) => ({ ...f, qrKey: key }))
      setQrPreview(URL.createObjectURL(file))
      toast.success('QR uploaded. Save to show it to students.')
    },
    onError: (err) => toast.error(errorText(err, (err as Error).message)),
  })
  const save = useMutation({
    mutationFn: () => {
      const body: Schemas['UpdatePaymentSettingsDto'] = {}
      ;(Object.keys(form) as (keyof Form)[]).forEach((k) => {
        if (form[k].trim()) body[k] = k === 'ifsc' ? form[k].trim().toUpperCase() : form[k].trim()
      })
      return api<Settings>('/payment-settings', { method: 'PUT', body })
    },
    onSuccess: (s) => {
      qc.setQueryData(['payment-settings'], s)
      toast.success('Payment details saved')
    },
    onError: (err) => toast.error(errorText(err)),
  })

  const errors = {
    upiId: form.upiId && !UPI.test(form.upiId.trim()) ? 'Looks like name@bank' : undefined,
    ifsc:
      form.ifsc && !IFSC.test(form.ifsc.trim().toUpperCase())
        ? '11 characters, like SBIN0001234'
        : undefined,
    bankAccountNo:
      form.bankAccountNo && !ACCOUNT.test(form.bankAccountNo.trim()) ? '9 to 18 digits' : undefined,
  }
  const hasError = Object.values(errors).some(Boolean)

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-5">
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
                    alt="School UPI QR code"
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
              <FieldWrap label="Payee name shown in UPI apps" htmlFor="ps-payee">
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
            <FieldWrap label="Account name" htmlFor="ps-an">
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
            <FieldWrap label="Bank and branch" htmlFor="ps-branch">
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
        </section>

        <div className="flex justify-end">
          <Btn
            busy={save.isPending}
            disabled={hasError || uploadQr.isPending}
            onClick={() => save.mutate()}
          >
            Save payment details
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
