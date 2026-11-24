import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { api, type Schemas } from '../../api/client'
import { checkFile, uploadFile } from '../../api/lookups'
import { errorText, fmtDate } from '../../ui'
import { GENDERS, fullName } from '../students/common'
import { inr } from '../fees/common'
import { pctText } from '../exams/common'

function Detail({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-muted text-xs font-medium">{label}</dt>
      <dd className="text-heading mt-0.5 text-sm">{children || '—'}</dd>
    </div>
  )
}

export function MyProfile() {
  const qc = useQueryClient()
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<Schemas['MeDto']>('/me') })
  const s = me.data?.student
  const photo = useQuery({
    queryKey: ['me', 'photo-url', s?.updatedAt],
    queryFn: () => api<Schemas['SignedUrlDto']>('/me/photo-url'),
    enabled: !!s?.hasPhoto,
    staleTime: 4 * 60_000,
  })
  const fees = useQuery({
    queryKey: ['me', 'fees'],
    queryFn: () => api<Schemas['StudentFeeSummaryDto']>('/me/fees'),
  })
  const results = useQuery({
    queryKey: ['me', 'results'],
    queryFn: () => api<Schemas['ResultListItemDto'][]>('/me/results'),
  })
  const input = useRef<HTMLInputElement>(null)
  const readOnly = s?.status === 'ALUMNI'

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const photoKey = await uploadFile(file, 'STUDENT_PHOTO')
      return api<Schemas['StudentDto']>('/me/photo', { method: 'PUT', body: { photoKey } })
    },
    onSuccess: () => {
      toast.success('Photo updated')
      qc.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err) => toast.error(errorText(err, (err as Error).message)),
  })

  if (me.isPending)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    )
  if (me.isError || !s)
    return (
      <p className="text-sm text-red-700">{errorText(me.error, "Couldn't load your profile.")}</p>
    )

  const latest = [...(results.data ?? [])].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  )[0]
  const due = fees.data && Number(fees.data.remainingAmount) > 0
  const address = [s.addressLine, s.city, s.state, s.pincode].filter(Boolean).join(', ')
  const initials = `${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase()

  return (
    <div className="flex flex-col gap-5">
      <section className="bg-brand-dark flex flex-wrap items-center gap-5 rounded-3xl p-6 text-white sm:p-8">
        <div className="relative">
          {photo.data ? (
            <img
              src={photo.data.url}
              alt=""
              className="h-21 w-21 rounded-full border-4 border-white/20 object-cover"
            />
          ) : (
            <span className="text-brand font-display grid h-21 w-21 place-items-center rounded-full bg-white text-[28px] font-semibold">
              {initials}
            </span>
          )}
          {!readOnly && (
            <button
              type="button"
              aria-label={s.hasPhoto ? 'Change photo' : 'Add photo'}
              disabled={upload.isPending}
              onClick={() => input.current?.click()}
              className="bg-accent absolute -right-1 -bottom-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white text-white"
            >
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          )}
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              const problem = checkFile(f, 'STUDENT_PHOTO')
              if (problem) toast.error(problem)
              else upload.mutate(f)
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-[28px] font-semibold text-white">{fullName(s)}</h1>
          <span className="text-sm text-blue-200">
            Admission no. <span className="font-mono">{s.admissionNo}</span> · admitted{' '}
            {fmtDate(s.admissionDate)}
          </span>
          {readOnly && (
            <span className="text-sm text-blue-100">Alumni · your portal is read-only.</span>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-5">
        <section className="dt flex min-w-0 flex-[2_1_440px] flex-col gap-4 p-5 sm:p-6">
          <h2 className="font-display text-heading text-[17px] font-semibold">My details</h2>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Date of birth">{fmtDate(s.dob)}</Detail>
            <Detail label="Gender">{GENDERS[s.gender]}</Detail>
            <Detail label="Blood group">{s.bloodGroup}</Detail>
            <Detail label="Guardian">{`${s.guardianName} (${s.guardianRelation})`}</Detail>
            <Detail label="Guardian mobile">{s.guardianPhone}</Detail>
            <Detail label="Sign-in email">{s.guardianEmail}</Detail>
            <Detail label="Address" wide>
              {address}
            </Detail>
          </dl>
          <p className="text-muted text-[13px]">
            Something wrong? Ask the school office to correct it.
          </p>
        </section>

        <section className="dt flex min-w-0 flex-[1_1_280px] flex-col gap-3 p-5 sm:p-6">
          <h2 className="font-display text-heading text-[17px] font-semibold">At a glance</h2>
          <Link
            to="/me/fees"
            className={`flex items-center justify-between gap-3 rounded-xl p-3.5 text-sm ${due ? 'bg-amber-50 text-amber-900' : 'bg-green-50 text-green-900'}`}
          >
            <span>Fees</span>
            <b className="tabular-nums">
              {fees.data ? (due ? `${inr(fees.data.remainingAmount)} to pay` : 'All paid') : '…'}
            </b>
          </Link>
          <Link
            to="/me/results"
            className="bg-tint-blue-soft text-brand-dark flex items-center justify-between gap-3 rounded-xl p-3.5 text-sm"
          >
            <span>Latest result</span>
            <b className="tabular-nums">
              {latest
                ? `${pctText(latest.percentage)}${latest.grade ? ` · ${latest.grade}` : ''}`
                : results.data
                  ? 'None yet'
                  : '…'}
            </b>
          </Link>
          <Link to="/me/account" className="text-brand text-[13px] font-medium">
            Account settings and password
          </Link>
        </section>
      </div>
    </div>
  )
}
