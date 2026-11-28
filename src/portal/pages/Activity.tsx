import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Input, Select } from '../../components/ui/Field'
import { api, type Schemas } from '../api/client'
import { Btn, PageHeader, errorText } from '../ui'

type Log = Schemas['ActivityLogDto']
const LIMIT = 50

// The API logs each change as `action: "POST /students/:id/documents"` and
// `entityType: "students"` (the first route segment). These are the areas the admin panel
// changes; the keys are sent as the entityType filter, so they must match the API exactly.
const AREAS: Record<string, [plural: string, singular: string]> = {
  students: ['Students', 'Student'],
  fees: ['Fees', 'Fee'],
  payments: ['Payments', 'Payment'],
  'payment-submissions': ['Payment requests', 'Payment request'],
  'payment-accounts': ['Payment accounts', 'Payment account'],
  exams: ['Exams', 'Exam'],
  admins: ['Admins', 'Admin'],
  invitations: ['Invites', 'Invite'],
  'academic-years': ['Academic years', 'Academic year'],
  classes: ['Classes', 'Class'],
  subjects: ['Subjects', 'Subject'],
  'grade-scales': ['Grade scales', 'Grade scale'],
  me: ['Own account', 'Own account'],
}
const AREA_TONE: Record<string, string> = {
  fees: 'bg-green-100 text-green-800',
  payments: 'bg-green-100 text-green-800',
  'payment-submissions': 'bg-green-100 text-green-800',
  'payment-accounts': 'bg-green-100 text-green-800',
  exams: 'bg-violet-100 text-violet-800',
  admins: 'bg-pink-100 text-pink-800',
  invitations: 'bg-pink-100 text-pink-800',
}

const pretty = (t: string) => t.replace(/[_.-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
const areaLabel = (t: string) => AREAS[t]?.[0] ?? pretty(t)
const areaSingular = (t: string) => AREAS[t]?.[1] ?? pretty(t)

// What the last fixed route segment means, e.g. "POST /payments/:id/void" → "voided".
const DID: Record<string, string> = {
  void: 'voided',
  approve: 'approved',
  decline: 'declined',
  publish: 'published',
  unpublish: 'unpublished',
  restore: 'restored',
  copy: 'copied',
  promote: 'promoted',
  resend: 'resent',
  revoke: 'revoked',
  status: 'changed the status',
  'set-current': 'set as current',
  marks: 'saved marks',
  subjects: 'updated the papers',
  documents: 'added a document',
  photo: 'updated the photo',
  enrollments: 'enrolled',
  fees: 'billed',
  'cash-payments': 'recorded cash',
  'payment-submissions': 'sent payment proof',
  password: 'changed the password',
}
const VERB: Record<string, string> = {
  POST: 'created',
  PUT: 'updated',
  PATCH: 'updated',
  DELETE: 'deleted',
}
/** "POST /payments/:id/void" → "voided"; "PATCH /students/:id" → "updated". */
function actionText(a: string) {
  const [method = '', route = ''] = a.split(' ')
  const fixed = route.split('/').filter((s) => s && !s.startsWith(':'))
  if (method === 'DELETE') return 'deleted'
  return (fixed.length > 1 && DID[fixed[fixed.length - 1]]) || VERB[method] || a.toLowerCase()
}
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
// Local calendar day (en-CA gives YYYY-MM-DD). iso.slice(0, 10) is the UTC day, so a 01:15 IST entry landed under "Yesterday".
const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA')
function dayLabel(key: string) {
  const d = new Date(`${key}T00:00:00`)
  const diff = Math.round((new Date(new Date().toDateString()).getTime() - d.getTime()) / 86400_000)
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return diff === 0
    ? `Today · ${date}`
    : diff === 1
      ? `Yesterday · ${date}`
      : d.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
}
const initials = (n: string | null) =>
  (n ?? 'System')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
const show = (v: unknown) =>
  v === null || v === undefined || v === ''
    ? 'empty'
    : typeof v === 'object'
      ? JSON.stringify(v)
      : String(v)
const label = (k: string) =>
  k
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())

function Changes({ changes }: { changes: Log['changes'] }) {
  const c = changes as {
    body?: Record<string, unknown> | null
    before?: Record<string, unknown> | null
    after?: Record<string, unknown> | null
  } | null
  // The API stores what was sent ({ body }, secrets redacted), not before/after values.
  if (c?.body && typeof c.body === 'object') {
    const sent = Object.entries(c.body)
    if (!sent.length) return <p className="text-muted text-[13px]">No details were sent.</p>
    return (
      <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-muted text-left text-[11px] tracking-wider uppercase">
              <th className="px-3 py-2 font-semibold">Field</th>
              <th className="px-3 py-2 font-semibold">Value sent</th>
            </tr>
          </thead>
          <tbody>
            {sent.map(([k, v]) => (
              <tr key={k} className="border-t border-slate-100">
                <td className="text-muted px-3 py-2">{label(k)}</td>
                <td className="text-heading px-3 py-2 font-medium break-all">{show(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  const keys = [
    ...new Set([...Object.keys(c?.before ?? {}), ...Object.keys(c?.after ?? {})]),
  ].filter((k) => JSON.stringify(c?.before?.[k]) !== JSON.stringify(c?.after?.[k]))
  if (!keys.length)
    return <p className="text-muted text-[13px]">No field-level changes recorded.</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-muted text-left text-[11px] tracking-wider uppercase">
            <th className="px-3 py-2 font-semibold">Field</th>
            <th className="px-3 py-2 font-semibold">Before</th>
            <th className="px-3 py-2 font-semibold">After</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className="border-t border-slate-100">
              <td className="text-muted px-3 py-2">{label(k)}</td>
              <td className="px-3 py-2 text-red-700 line-through decoration-red-300">
                {show(c?.before?.[k])}
              </td>
              <td className="px-3 py-2 font-semibold text-green-700">{show(c?.after?.[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Activity() {
  const [params, setParams] = useSearchParams()
  const actorId = params.get('who') ?? ''
  const entityType = params.get('area') ?? ''
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const set = (k: string, v: string) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p)
        if (v) n.set(k, v)
        else n.delete(k)
        return n
      },
      { replace: true }
    )
  const admins = useQuery({
    queryKey: ['admins', ''],
    queryFn: () => api<Schemas['PaginatedAdminsDto']>('/admins', { query: { limit: 100 } }),
  })
  const logs = useInfiniteQuery({
    queryKey: ['activity', { actorId, entityType, from, to }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api<Schemas['PaginatedActivityLogsDto']>('/activity-logs', {
        query: {
          actorId: actorId || undefined,
          entityType: entityType || undefined,
          from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
          to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
          page: pageParam,
          limit: LIMIT,
        },
      }),
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  })
  const [open, setOpen] = useState<string | null>(null)
  const items = logs.data?.pages.flatMap((p) => p.items) ?? []
  const groups: [string, Log[]][] = []
  for (const l of items) {
    const k = dayKey(l.createdAt)
    if (groups.at(-1)?.[0] === k) groups.at(-1)![1].push(l)
    else groups.push([k, [l]])
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Activity log"
        sub="Who changed what, and when. Entries can't be edited or deleted."
      />
      <section className="dt">
        <div className="dt-bar">
          <div className="flex flex-wrap gap-2">
            <Select
              aria-label="Person"
              value={actorId}
              onChange={(e) => set('who', e.target.value)}
              className="min-h-11 w-auto py-2"
            >
              <option value="">Everyone</option>
              {(admins.data?.items ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Area"
              value={entityType}
              onChange={(e) => set('area', e.target.value)}
              className="min-h-11 w-auto py-2"
            >
              <option value="">All areas</option>
              {Object.entries(AREAS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v[0]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="act-from" className="text-muted">
              From
            </label>
            <Input
              id="act-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => set('from', e.target.value)}
              className="min-h-11 w-auto py-2"
            />
            <label htmlFor="act-to" className="text-muted">
              to
            </label>
            <Input
              id="act-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => set('to', e.target.value)}
              className="min-h-11 w-auto py-2"
            />
          </div>
        </div>

        {logs.isPending && (
          <div className="flex flex-col gap-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}
        {logs.isError && (
          <p className="p-6 text-sm text-red-700">
            {errorText(logs.error, "Couldn't load the activity log.")}
          </p>
        )}
        {logs.data && !items.length && (
          <p className="text-muted p-10 text-center text-sm">Nothing logged for these filters.</p>
        )}

        {groups.map(([day, list]) => (
          <div key={day}>
            <div className="text-muted flex items-center justify-between border-y border-slate-100 bg-slate-50 px-6 py-2.5 text-xs font-semibold tracking-wider uppercase">
              <span>{dayLabel(day)}</span>
              <span className="font-medium tracking-normal normal-case">
                {list.length} {list.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <ol className="relative">
              <span
                aria-hidden
                className="absolute top-0 bottom-0 left-[118px] w-px bg-slate-200 max-sm:hidden"
              />
              {list.map((l) => {
                const expanded = open === l.id
                const hasChanges = !!l.changes
                const tone = AREA_TONE[l.entityType] ?? 'bg-blue-100 text-blue-800'
                return (
                  <li
                    key={l.id}
                    className={`relative grid grid-cols-[72px_32px_minmax(0,1fr)] items-start gap-3.5 px-6 py-3.5 text-sm max-sm:grid-cols-[32px_minmax(0,1fr)] ${expanded ? 'bg-tint-blue-soft' : ''}`}
                  >
                    <span className="text-muted pt-1.5 text-[13px] tabular-nums max-sm:hidden">
                      {time(l.createdAt)}
                    </span>
                    <span
                      className={`relative z-[1] grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold ring-4 ring-white ${l.actorRole === 'ADMIN' ? 'bg-brand text-white' : 'bg-pink-100 text-pink-700'}`}
                    >
                      {initials(l.actorName)}
                    </span>
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="leading-relaxed">
                          <b className="text-heading">{l.actorName ?? 'System'}</b>{' '}
                          {actionText(l.action)}
                          {l.entityId && (
                            <span className="text-muted"> · {areaSingular(l.entityType)}</span>
                          )}
                          <span
                            className={`ml-2 inline-block rounded-md px-2 py-0.5 align-middle text-[11px] font-semibold ${tone}`}
                          >
                            {areaLabel(l.entityType)}
                          </span>
                          <span className="text-muted ml-2 text-xs sm:hidden">
                            {time(l.createdAt)}
                          </span>
                        </span>
                        {hasChanges && (
                          <button
                            type="button"
                            aria-expanded={expanded}
                            onClick={() => setOpen(expanded ? null : l.id)}
                            className="text-brand inline-flex min-h-8 items-center gap-1 text-[13px] font-medium"
                          >
                            {expanded ? (
                              <ChevronDown className="h-4 w-4" aria-hidden />
                            ) : (
                              <ChevronRight className="h-4 w-4" aria-hidden />
                            )}
                            {expanded ? 'Hide changes' : 'Show changes'}
                          </button>
                        )}
                      </div>
                      {expanded && (
                        <>
                          <Changes changes={l.changes} />
                          {(l.ip || l.userAgent) && (
                            <span className="text-muted text-xs">
                              {[
                                l.userAgent &&
                                  (/(Edg|Chrome|Firefox|Safari)\//.exec(l.userAgent)?.[1] ??
                                    'Browser'),
                                l.ip,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}

        {logs.hasNextPage && (
          <div className="flex justify-center border-t border-slate-100 p-4">
            <Btn
              variant="outline"
              busy={logs.isFetchingNextPage}
              onClick={() => logs.fetchNextPage()}
            >
              Load older entries
            </Btn>
          </div>
        )}
      </section>
    </div>
  )
}
