import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, Pencil, Power, RotateCw, X } from 'lucide-react'
import { FieldWrap, Input, Select } from '../../components/ui/Field'
import { api, type Schemas } from '../api/client'
import { useSession } from '../auth/session'
import { Btn, ConfirmDialog, Dialog, PageHeader, Pill, TableState, errorText, fmtDate } from '../ui'

type Admin = Schemas['UserDto']
type Invite = Schemas['InvitationDto']

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export function Users() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'invites' ? 'invites' : 'admins'
  const [inviting, setInviting] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Users and invites"
        sub="Admins who run the school office, and the invites sent to admins and students."
        actions={
          <Btn onClick={() => setInviting(true)}>
            <Mail className="h-4 w-4" aria-hidden /> Invite an admin
          </Btn>
        }
      />
      <nav aria-label="Users sections" className="border-border flex gap-7 border-b">
        {(
          [
            ['admins', 'Admins'],
            ['invites', 'Invites'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => setParams({ tab: key }, { replace: true })}
            className={`min-h-11 border-b-2 px-1 text-sm ${tab === key ? 'border-brand text-brand font-semibold' : 'text-muted hover:text-brand border-transparent font-medium'}`}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === 'admins' ? <Admins /> : <Invites />}
      <InviteAdminDialog open={inviting} onClose={() => setInviting(false)} />
    </div>
  )
}

/* ---------- Admins ---------- */

function Admins() {
  const qc = useQueryClient()
  const { user } = useSession()
  const [active, setActive] = useState<'' | 'true' | 'false'>('')
  const admins = useQuery({
    queryKey: ['admins', active],
    queryFn: () =>
      api<Schemas['PaginatedAdminsDto']>('/admins', {
        query: { isActive: active || undefined, limit: 100 },
      }),
  })
  const [editing, setEditing] = useState<Admin | null>(null)
  const [toggling, setToggling] = useState<Admin | null>(null)
  const status = useMutation({
    mutationFn: (a: Admin) =>
      api<Admin>(`/admins/${a.id}/status`, { method: 'PATCH', body: { isActive: !a.isActive } }),
    onSuccess: (a) => {
      toast.success(`${a.fullName} is now ${a.isActive ? 'active' : 'deactivated'}`)
      setToggling(null)
      qc.invalidateQueries({ queryKey: ['admins'] })
    },
    onError: (err) => {
      setToggling(null)
      toast.error(errorText(err))
    },
  })
  const items = admins.data?.items ?? []

  return (
    <section className="dt">
      <div className="dt-bar">
        <h2 className="dt-title">
          Admins <span className="dt-count">{admins.data?.total ?? 0}</span>
        </h2>
        <Select
          aria-label="Status"
          value={active}
          onChange={(e) => setActive(e.target.value as typeof active)}
          className="min-h-11 w-auto py-2"
        >
          <option value="">Active and deactivated</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Since</th>
              <th>Status</th>
              <th className="text-right!">Actions</th>
            </tr>
          </thead>
          <tbody>
            <TableState
              cols={5}
              loading={admins.isPending}
              error={admins.error}
              empty={!items.length}
              emptyText="No admins match this filter."
              onRetry={() => admins.refetch()}
            />
            {items.map((a) => {
              const self = a.id === user?.id
              return (
                <tr key={a.id}>
                  <td>
                    <span className="flex items-center gap-3">
                      <span className="bg-tint-blue text-brand grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold">
                        {initials(a.fullName)}
                      </span>
                      <span className="flex flex-col">
                        <b className="text-heading font-semibold">
                          {a.fullName}
                          {self && <span className="text-muted font-normal"> (you)</span>}
                        </b>
                        <small className="text-muted text-xs">{a.email}</small>
                      </span>
                    </span>
                  </td>
                  <td>{a.phone || '—'}</td>
                  <td className="text-muted text-[13px]">{fmtDate(a.createdAt)}</td>
                  <td>
                    {a.isActive ? (
                      <Pill tone="green">Active</Pill>
                    ) : (
                      <Pill tone="slate">Deactivated</Pill>
                    )}
                  </td>
                  <td>
                    <div className="ra">
                      <button
                        type="button"
                        aria-label={`Edit ${a.fullName}`}
                        onClick={() => setEditing(a)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={a.isActive ? 'danger' : undefined}
                        aria-label={`${a.isActive ? 'Deactivate' : 'Activate'} ${a.fullName}`}
                        title={
                          self
                            ? "You can't deactivate your own account"
                            : a.isActive
                              ? 'Deactivate'
                              : 'Activate'
                        }
                        disabled={self}
                        onClick={() => (a.isActive ? setToggling(a) : status.mutate(a))}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {editing && <EditAdminDialog admin={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!toggling}
        onClose={() => setToggling(null)}
        title={`Deactivate ${toggling?.fullName ?? ''}?`}
        body="They're signed out everywhere and can't sign in until an admin activates them again."
        confirmLabel="Deactivate"
        busy={status.isPending}
        onConfirm={() => toggling && status.mutate(toggling)}
      />
    </section>
  )
}

const adminSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter the name'),
  email: z.email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?\d[\d ]{7,14})?$/, 'Enter a valid phone number'),
})
type AdminForm = z.infer<typeof adminSchema>

function InviteAdminDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const form = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: { fullName: '', email: '', phone: '' },
  })
  const send = useMutation({
    mutationFn: (v: AdminForm) =>
      api<Invite>('/admins', { method: 'POST', body: { ...v, phone: v.phone || undefined } }),
    onSuccess: (inv) => {
      toast.success(`Invite sent to ${inv.email}. The link works for 72 hours.`)
      form.reset()
      qc.invalidateQueries({ queryKey: ['invitations'] })
      onClose()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const e = form.formState.errors
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Invite an admin"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn busy={send.isPending} onClick={form.handleSubmit((v) => send.mutate(v))}>
            Send invite
          </Btn>
        </>
      }
    >
      <p>
        They get an email with a link to set their password. Their account is created when they
        accept.
      </p>
      <FieldWrap label="Full name" htmlFor="ia-name" required error={e.fullName?.message}>
        <Input id="ia-name" error={e.fullName?.message} {...form.register('fullName')} />
      </FieldWrap>
      <FieldWrap label="Email" htmlFor="ia-email" required error={e.email?.message}>
        <Input id="ia-email" type="email" error={e.email?.message} {...form.register('email')} />
      </FieldWrap>
      <FieldWrap label="Phone" htmlFor="ia-phone" hint="Optional" error={e.phone?.message}>
        <Input id="ia-phone" type="tel" error={e.phone?.message} {...form.register('phone')} />
      </FieldWrap>
    </Dialog>
  )
}

function EditAdminDialog({ admin, onClose }: { admin: Admin; onClose: () => void }) {
  const qc = useQueryClient()
  const [fullName, setFullName] = useState(admin.fullName)
  const [phone, setPhone] = useState(admin.phone ?? '')
  const save = useMutation({
    mutationFn: () =>
      api<Admin>(`/admins/${admin.id}`, {
        method: 'PATCH',
        body: { fullName: fullName.trim(), phone: phone.trim() || undefined },
      }),
    onSuccess: () => {
      toast.success('Saved')
      qc.invalidateQueries({ queryKey: ['admins'] })
      onClose()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit ${admin.fullName}`}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn busy={save.isPending} disabled={!fullName.trim()} onClick={() => save.mutate()}>
            Save
          </Btn>
        </>
      }
    >
      <label htmlFor="ea-name" className="text-heading text-sm font-medium">
        Full name
      </label>
      <Input id="ea-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <label htmlFor="ea-phone" className="text-heading text-sm font-medium">
        Phone
      </label>
      <Input id="ea-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <p className="text-muted text-[13px]">
        The sign-in email ({admin.email}) can't be changed here.
      </p>
    </Dialog>
  )
}

/* ---------- Invites ---------- */

const INVITE_STATUS: Record<
  Invite['status'],
  { label: string; tone: 'blue' | 'amber' | 'green' | 'slate' }
> = {
  PENDING: { label: 'Pending', tone: 'blue' },
  EXPIRED: { label: 'Expired', tone: 'amber' },
  ACCEPTED: { label: 'Accepted', tone: 'green' },
  REVOKED: { label: 'Revoked', tone: 'slate' },
}

function expiryHint(i: Invite) {
  if (i.status !== 'PENDING') return null
  const hours = Math.round((new Date(i.expiresAt).getTime() - Date.now()) / 3600_000)
  if (hours <= 0) return 'Expires soon'
  return hours < 24 ? `Expires in ${hours} hours` : `Expires in ${Math.round(hours / 24)} days`
}

function Invites() {
  const qc = useQueryClient()
  const [status, setStatus] = useState<'' | Invite['status']>('')
  const [role, setRole] = useState<'' | Invite['role']>('')
  const invites = useQuery({
    queryKey: ['invitations', status, role],
    queryFn: () =>
      api<Schemas['PaginatedInvitationsDto']>('/invitations', {
        query: { status: status || undefined, role: role || undefined, limit: 100 },
      }),
    placeholderData: keepPreviousData,
  })
  const [revoking, setRevoking] = useState<Invite | null>(null)
  const refresh = () => qc.invalidateQueries({ queryKey: ['invitations'] })

  // Resending creates a fresh invite; an older pending one for the same person stops working.
  const resend = useMutation({
    mutationFn: (i: Invite) =>
      i.role === 'STUDENT' && i.studentId
        ? api('/invitations', { method: 'POST', body: { items: [{ studentId: i.studentId }] } })
        : api('/admins', { method: 'POST', body: { email: i.email, fullName: i.fullName } }),
    onSuccess: (_, i) => {
      toast.success(`New invite sent to ${i.email}`)
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const revoke = useMutation({
    mutationFn: (i: Invite) => api(`/invitations/${i.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Invite revoked. The link no longer works.')
      setRevoking(null)
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const items = invites.data?.items ?? []

  return (
    <section className="dt">
      <div className="dt-bar">
        <h2 className="dt-title">
          Invites <span className="dt-count">{invites.data?.total ?? 0}</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <Select
            aria-label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="min-h-11 w-auto py-2"
          >
            <option value="">All roles</option>
            <option value="STUDENT">Students</option>
            <option value="ADMIN">Admins</option>
          </Select>
          <Select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="min-h-11 w-auto py-2"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="EXPIRED">Expired</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REVOKED">Revoked</option>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Sent</th>
              <th>Status</th>
              <th className="text-right!">Actions</th>
            </tr>
          </thead>
          <tbody>
            <TableState
              cols={5}
              loading={invites.isPending}
              error={invites.error}
              empty={!items.length}
              emptyText="No invites match these filters."
              onRetry={() => invites.refetch()}
            />
            {items.map((i) => {
              const hint = expiryHint(i)
              return (
                <tr key={i.id}>
                  <td>
                    <span className="flex flex-col">
                      <b className="text-heading font-semibold">{i.fullName}</b>
                      <small className="text-muted text-xs">{i.email}</small>
                    </span>
                  </td>
                  <td>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium ${i.role === 'ADMIN' ? 'bg-tint-pink text-accent-ink' : 'bg-tint-blue text-brand'}`}
                    >
                      {i.role === 'ADMIN' ? 'Admin' : 'Student'}
                    </span>
                  </td>
                  <td>
                    <span className="flex flex-col">
                      <span className="text-heading">{fmtDate(i.createdAt)}</span>
                      {hint && <small className="text-muted text-xs">{hint}</small>}
                    </span>
                  </td>
                  <td>
                    <Pill tone={INVITE_STATUS[i.status].tone}>{INVITE_STATUS[i.status].label}</Pill>
                  </td>
                  <td>
                    <div className="ra">
                      {(i.status === 'PENDING' || i.status === 'EXPIRED') && (
                        <button
                          type="button"
                          aria-label={`Resend invite to ${i.fullName}`}
                          title="Resend"
                          disabled={resend.isPending}
                          onClick={() => resend.mutate(i)}
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                      )}
                      {i.status === 'PENDING' && (
                        <button
                          type="button"
                          className="danger"
                          aria-label={`Revoke invite for ${i.fullName}`}
                          title="Revoke"
                          onClick={() => setRevoking(i)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-muted border-t border-slate-100 px-6 py-3 text-[13px]">
        Invite links work once and expire after 72 hours.
      </p>
      <ConfirmDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        title={`Revoke the invite for ${revoking?.fullName ?? ''}?`}
        body="The link in their email stops working. You can send a new invite later."
        confirmLabel="Revoke invite"
        busy={revoke.isPending}
        onConfirm={() => revoking && revoke.mutate(revoking)}
      />
    </section>
  )
}
