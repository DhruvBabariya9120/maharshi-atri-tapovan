import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Circle, Monitor } from 'lucide-react'
import { FieldWrap, Input } from '../../components/ui/Field'
import { ApiError, api, type Schemas } from '../api/client'
import { useSession } from '../auth/session'
import { Btn, PageHeader, Pill, errorText } from '../ui'

const card = 'dt flex flex-col gap-4 p-5 sm:p-6'
const h2 = 'font-display text-heading text-[17px] font-semibold'

/** "Chrome on Windows" from a user-agent string; good enough for a device list. */
function describeAgent(ua: string) {
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser'
  const os = /iPhone|iPad/.test(ua)
    ? 'iPhone'
    : /Android/.test(ua)
      ? 'Android'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS/.test(ua)
          ? 'Mac'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'unknown device'
  return `${browser} on ${os}`
}

const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 2) return 'Active now'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hours ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function AccountSettings() {
  const { user } = useSession()
  return (
    <div className="flex max-w-220 flex-col gap-5">
      <PageHeader
        title="Account settings"
        sub={
          user?.role === 'STUDENT'
            ? 'Your sign-in details and devices.'
            : 'Your profile, password and devices.'
        }
      />
      <Profile />
      <ChangePassword />
      <Sessions />
    </div>
  )
}

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?\d[\d ]{7,14})?$/, 'Enter a valid phone number'),
})

function Profile() {
  const qc = useQueryClient()
  const { renameUser } = useSession()
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<Schemas['MeDto']>('/me') })
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: me.data ? { fullName: me.data.fullName, phone: me.data.phone ?? '' } : undefined,
  })
  const save = useMutation({
    mutationFn: (body: Schemas['UpdateMeDto']) =>
      api<Schemas['MeDto']>('/me', { method: 'PATCH', body }),
    onSuccess: (m) => {
      qc.setQueryData(['me'], m)
      renameUser(m.fullName)
      toast.success('Profile saved')
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const e = form.formState.errors

  return (
    <form
      className={card}
      noValidate
      onSubmit={form.handleSubmit((v) =>
        save.mutate({ fullName: v.fullName, phone: v.phone || undefined })
      )}
    >
      <h2 className={h2}>Profile</h2>
      {me.isError && (
        <p className="text-sm text-red-700">{errorText(me.error, "Couldn't load your profile.")}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldWrap label="Full name" htmlFor="fullName" error={e.fullName?.message}>
          <Input
            id="fullName"
            disabled={me.isPending}
            error={e.fullName?.message}
            {...form.register('fullName')}
          />
        </FieldWrap>
        <FieldWrap label="Phone" htmlFor="phone" hint="Optional" error={e.phone?.message}>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            disabled={me.isPending}
            error={e.phone?.message}
            {...form.register('phone')}
          />
        </FieldWrap>
        <FieldWrap
          label="Email"
          htmlFor="email"
          hint="Ask the school office to change your sign-in email."
        >
          <Input id="email" value={me.data?.email ?? ''} readOnly className="bg-surface" />
        </FieldWrap>
      </div>
      <Btn
        type="submit"
        variant="outline"
        busy={save.isPending}
        disabled={me.isPending}
        className="self-start"
      >
        Save profile
      </Btn>
    </form>
  )
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(10, 'At least 10 characters')
      .max(72, 'At most 72 characters')
      .regex(/\d/, 'Include at least one number'),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ['confirm'],
    message: "Passwords don't match",
  })

function ChangePassword() {
  const { user } = useSession()
  const [pw, setPw] = useState('')
  const form = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) })
  const change = useMutation({
    mutationFn: (body: Schemas['ChangePasswordDto']) =>
      api('/auth/change-password', { method: 'POST', body }),
    onSuccess: () => {
      toast.success('Password updated')
      form.reset({ currentPassword: '', newPassword: '', confirm: '' })
      setPw('')
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401)
        form.setError('currentPassword', { message: 'Current password is wrong' })
      else toast.error(errorText(err))
    },
  })
  const e = form.formState.errors
  const rules = [
    { label: 'At least 10 characters', ok: pw.length >= 10 && pw.length <= 72 },
    { label: 'Includes a number', ok: /\d/.test(pw) },
    {
      label: 'Not the same as your email',
      ok: !!pw && pw.toLowerCase() !== user?.email.toLowerCase(),
    },
  ]

  return (
    <form
      className={card}
      noValidate
      onSubmit={form.handleSubmit((v) =>
        change.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword })
      )}
    >
      <h2 className={h2}>Change password</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <FieldWrap
          label="Current password"
          htmlFor="currentPassword"
          error={e.currentPassword?.message}
        >
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            error={e.currentPassword?.message}
            {...form.register('currentPassword')}
          />
        </FieldWrap>
        <FieldWrap label="New password" htmlFor="newPassword" error={e.newPassword?.message}>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            error={e.newPassword?.message}
            {...form.register('newPassword', { onChange: (ev) => setPw(ev.target.value) })}
          />
        </FieldWrap>
        <FieldWrap label="Confirm new password" htmlFor="confirm" error={e.confirm?.message}>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            error={e.confirm?.message}
            {...form.register('confirm')}
          />
        </FieldWrap>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
        {rules.map((r) => (
          <li
            key={r.label}
            className={`flex items-center gap-1.5 ${r.ok ? 'text-green-700' : 'text-muted'}`}
          >
            {r.ok ? (
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            {r.label}
          </li>
        ))}
      </ul>
      <Btn
        type="submit"
        busy={change.isPending}
        disabled={!rules.every((r) => r.ok)}
        className="self-start"
      >
        Update password
      </Btn>
    </form>
  )
}

function Sessions() {
  const qc = useQueryClient()
  const sessions = useQuery({
    queryKey: ['me', 'sessions'],
    queryFn: () => api<Schemas['SessionDto'][]>('/me/sessions'),
  })
  const revoke = useMutation({
    mutationFn: () => api('/me/sessions/revoke-others', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Signed out of all other devices')
      qc.invalidateQueries({ queryKey: ['me', 'sessions'] })
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const list = [...(sessions.data ?? [])].sort((a, b) => Number(b.current) - Number(a.current))
  const others = list.filter((s) => !s.current).length

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={h2}>Where you're signed in</h2>
        <Btn
          variant="outline"
          busy={revoke.isPending}
          disabled={!others}
          onClick={() => revoke.mutate()}
          className="text-red-700"
        >
          Sign out of all other devices
        </Btn>
      </div>
      {sessions.isPending && <div className="h-12 animate-pulse rounded-xl bg-slate-100" />}
      {sessions.isError && (
        <p className="text-sm text-red-700">
          {errorText(sessions.error, "Couldn't load your devices.")}
        </p>
      )}
      <ul className="flex flex-col">
        {list.map((s) => (
          <li
            key={s.familyId}
            className="border-border flex flex-wrap items-center justify-between gap-3 border-t py-3.5 text-sm first:border-t-0"
          >
            <span className="flex items-center gap-3">
              <span className="bg-tint-blue text-brand grid h-9 w-9 place-items-center rounded-xl">
                <Monitor className="h-4.5 w-4.5" aria-hidden />
              </span>
              <span className="flex flex-col">
                <b className="text-heading font-semibold">{describeAgent(s.userAgent ?? '')}</b>
                {s.ip && <small className="text-muted text-xs">{s.ip}</small>}
              </span>
            </span>
            {s.current ? (
              <Pill tone="green">This device</Pill>
            ) : (
              <span className="text-muted">{ago(s.lastUsedAt)}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
