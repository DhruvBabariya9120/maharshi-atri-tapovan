import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Eye, Plus, Search } from 'lucide-react'
import { Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { useClasses, useYears } from '../../api/lookups'
import { PageHeader, TableState, errorText } from '../../ui'
import { StatusPill, StudentAvatar, fullName, type StudentStatus } from './common'

const LIMIT = 25
type Sort = 'name' | 'admissionNo' | 'createdAt'

export function StudentList() {
  const navigate = useNavigate()
  // Filters live in the URL so the list survives a reload and Back from a profile.
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const classId = params.get('class') ?? ''
  const statusParam = params.get('status') ?? 'ACTIVE'
  const status = (statusParam === 'all' ? '' : statusParam) as StudentStatus | ''
  const sort = (params.get('sort') ?? 'name') as Sort
  const order = (params.get('order') ?? 'asc') as 'asc' | 'desc'
  const page = Number(params.get('page') ?? 1)
  const set = (patch: Record<string, string>) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
        if (!('page' in patch)) next.delete('page')
        return next
      },
      { replace: true }
    )

  const years = useYears()
  const classes = useClasses(years.current?.id)
  const students = useQuery({
    queryKey: ['students', { q, classId, status, sort, order, page, year: years.current?.id }],
    queryFn: () =>
      api<Schemas['PaginatedStudentsDto']>('/students', {
        query: {
          q,
          classId: classId || undefined,
          academicYearId: classId ? years.current?.id : undefined,
          status: status || undefined,
          sort,
          order,
          page,
          limit: LIMIT,
        },
      }),
    placeholderData: keepPreviousData,
  })

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const items = students.data?.items ?? []
  const total = students.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / LIMIT))
  const allOnPage = items.length > 0 && items.every((s) => selected.has(s.id))

  const invite = useMutation({
    mutationFn: (ids: string[]) =>
      api<Schemas['InvitationsResultDto']>('/invitations', {
        method: 'POST',
        body: { items: ids.map((studentId) => ({ studentId })) },
      }),
    onSuccess: (r) => {
      toast.success(
        `Sent ${r.items.length} login ${r.items.length === 1 ? 'invite' : 'invites'} to guardian emails`
      )
      setSelected(new Set())
    },
    onError: (err) => toast.error(errorText(err)),
  })

  const sortHeader = (key: Sort, label: string) => {
    const on = sort === key
    const Icon = on && order === 'desc' ? ArrowDown : ArrowUp
    return (
      <th aria-sort={on ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          onClick={() => set({ sort: key, order: on && order === 'asc' ? 'desc' : 'asc' })}
          className={`inline-flex items-center gap-1 uppercase ${on ? 'text-brand' : ''}`}
        >
          {label}
          <Icon className={`h-3.5 w-3.5 ${on ? '' : 'opacity-30'}`} aria-hidden />
        </button>
      </th>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Students"
        sub={years.current ? `Academic year ${years.current.name}` : undefined}
        actions={
          <>
            <Link
              to="/admin/promote"
              className="border-border text-heading hover:border-brand hover:text-brand inline-flex min-h-11 items-center rounded-full border bg-white px-5 text-sm font-medium"
            >
              Promote to next year
            </Link>
            <Link
              to="/admin/students/new"
              className="bg-brand hover:bg-brand-dark inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)]"
            >
              <Plus className="h-4 w-4" aria-hidden /> Add student
            </Link>
          </>
        }
      />

      <section className="dt">
        <div className="dt-bar">
          <label className="border-border text-muted flex min-h-11 flex-1 basis-64 items-center gap-2 rounded-xl border bg-slate-50 px-3 text-sm">
            <Search className="h-4 w-4" aria-hidden />
            <input
              aria-label="Search by name or admission number"
              placeholder="Name or admission no."
              defaultValue={q}
              onChange={(e) => set({ q: e.target.value.trim() })}
              className="text-heading flex-1 bg-transparent outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Select
              aria-label="Class"
              value={classId}
              onChange={(e) => set({ class: e.target.value })}
              className="min-h-11 w-auto py-2"
            >
              <option value="">All classes</option>
              {classes.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.standard}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Status"
              value={statusParam}
              onChange={(e) => set({ status: e.target.value })}
              className="min-h-11 w-auto py-2"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALUMNI">Alumni</option>
              <option value="all">All statuses</option>
            </Select>
          </div>
        </div>

        {selected.size > 0 && (
          <div
            className="bg-brand-dark flex flex-wrap items-center gap-3 px-6 py-2.5 text-[13px] text-white"
            role="status"
          >
            <b>{selected.size} selected</b>
            <button
              type="button"
              disabled={invite.isPending}
              onClick={() => invite.mutate([...selected])}
              className="min-h-8 rounded-lg border border-white/35 px-3 hover:bg-white/10 disabled:opacity-60"
            >
              {invite.isPending ? 'Sending…' : 'Send login invite'}
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto min-h-8 px-2 hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-11">
                  <input
                    type="checkbox"
                    className="accent-brand h-4.5 w-4.5 align-middle"
                    aria-label="Select all students on this page"
                    checked={allOnPage}
                    onChange={() =>
                      setSelected((s) => {
                        const n = new Set(s)
                        items.forEach((st) => (allOnPage ? n.delete(st.id) : n.add(st.id)))
                        return n
                      })
                    }
                  />
                </th>
                {sortHeader('name', 'Student')}
                {sortHeader('admissionNo', 'Admission no.')}
                <th>Guardian</th>
                <th>Status</th>
                <th className="text-right!">Actions</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                cols={6}
                loading={students.isPending}
                error={students.error}
                empty={!items.length}
                emptyText={
                  q || classId
                    ? 'No students match these filters.'
                    : 'No students yet. Add the first one.'
                }
                onRetry={() => students.refetch()}
              />
              {items.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/students/${s.id}`)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="accent-brand h-4.5 w-4.5 align-middle"
                      aria-label={`Select ${fullName(s)}`}
                      checked={selected.has(s.id)}
                      onChange={() =>
                        setSelected((cur) => {
                          const n = new Set(cur)
                          if (n.has(s.id)) n.delete(s.id)
                          else n.add(s.id)
                          return n
                        })
                      }
                    />
                  </td>
                  <td>
                    <span className="flex items-center gap-3">
                      <StudentAvatar student={s} />
                      <Link
                        to={`/admin/students/${s.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-heading hover:text-brand font-semibold"
                      >
                        {fullName(s)}
                      </Link>
                    </span>
                  </td>
                  <td className="font-mono text-[13px] whitespace-nowrap">{s.admissionNo}</td>
                  <td>
                    <span className="flex flex-col">
                      <span className="text-heading">{s.guardianName}</span>
                      <small className="text-muted text-xs">{s.guardianPhone}</small>
                    </span>
                  </td>
                  <td>
                    <StatusPill status={s.status} />
                  </td>
                  <td>
                    <div className="ra">
                      <Link
                        to={`/admin/students/${s.id}`}
                        aria-label={`Open ${fullName(s)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3.5 text-[13px]">
          <span>
            {total ? (
              <>
                Showing{' '}
                <b className="text-heading">
                  {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}
                </b>{' '}
                of {total}
              </>
            ) : (
              '0 students'
            )}
          </span>
          <nav aria-label="Pages" className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => set({ page: String(page - 1) })}
              className="border-border grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pages}
              onClick={() => set({ page: String(page + 1) })}
              className="border-border grid h-9 w-9 place-items-center rounded-lg border bg-white disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </section>
    </div>
  )
}
