import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react'
import { Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { useClasses, useYears } from '../../api/lookups'
import { PageHeader, TableState, fmtDate } from '../../ui'
import { EXAM_TYPES, ExamStatus, TYPE_TONE, dateRange, type ExamType } from './common'

const LIMIT = 25

export function ExamList() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const type = (params.get('type') ?? '') as ExamType | ''
  const classId = params.get('class') ?? ''
  const status = params.get('status') ?? ''
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
  const yearId = years.current?.id
  const classes = useClasses(yearId)
  const exams = useQuery({
    queryKey: ['exams', { type, classId, status, page, yearId }],
    queryFn: () =>
      api<Schemas['PaginatedExamsDto']>('/exams', {
        query: {
          academicYearId: yearId,
          classId: classId || undefined,
          type: type || undefined,
          status: status || undefined,
          page,
          limit: LIMIT,
        },
      }),
    enabled: !!yearId,
    placeholderData: keepPreviousData,
  })
  const items = exams.data?.items ?? []
  const total = exams.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Exams"
        sub={
          years.current
            ? `Semester exams and weekly, monthly and other tests for ${years.current.name}.`
            : undefined
        }
        actions={
          <Link
            to="/admin/exams/new"
            className="bg-brand hover:bg-brand-dark inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)]"
          >
            <Plus className="h-4 w-4" aria-hidden /> Create exam
          </Link>
        }
      />
      <section className="dt">
        <div className="dt-bar">
          <div role="group" aria-label="Exam type" className="flex flex-wrap gap-1.5">
            {(['', ...Object.keys(EXAM_TYPES)] as (ExamType | '')[]).map((t) => (
              <button
                key={t || 'all'}
                type="button"
                aria-pressed={type === t}
                onClick={() => set({ type: t })}
                className={`min-h-10 rounded-full border px-4 text-[13px] font-medium ${type === t ? 'border-brand bg-brand text-white' : 'border-border text-content bg-white'}`}
              >
                {t ? EXAM_TYPES[t] : 'All types'}
              </button>
            ))}
          </div>
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
              value={status}
              onChange={(e) => set({ status: e.target.value })}
              className="min-h-11 w-auto py-2"
            >
              <option value="">Draft and published</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                cols={4}
                loading={exams.isPending}
                error={exams.error}
                empty={!items.length}
                emptyText={
                  type || classId || status
                    ? 'No exams match these filters.'
                    : 'No exams yet. Create the first one.'
                }
                onRetry={() => exams.refetch()}
              />
              {items.map((e) => (
                <tr
                  key={e.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/exams/${e.id}`)}
                >
                  <td>
                    <span className="flex items-center gap-3">
                      <span
                        className={`grid h-9.5 w-9.5 shrink-0 place-items-center rounded-xl ${TYPE_TONE[e.type]}`}
                      >
                        <FileText className="h-4.5 w-4.5" aria-hidden />
                      </span>
                      <span className="flex flex-col">
                        <Link
                          to={`/admin/exams/${e.id}`}
                          onClick={(ev) => ev.stopPropagation()}
                          className="text-heading hover:text-brand font-semibold"
                        >
                          {e.name}
                        </Link>
                        <small className="text-muted text-xs">
                          {e.classStandard} · {EXAM_TYPES[e.type]}
                        </small>
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{dateRange(e.startDate, e.endDate)}</td>
                  <td>
                    <ExamStatus exam={e} />
                  </td>
                  <td className="text-muted text-[13px] whitespace-nowrap">
                    {e.publishedAt
                      ? `${fmtDate(e.publishedAt)}${e.publishCount > 1 ? ` · ${e.publishCount} times` : ''}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-muted flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3.5 text-[13px]">
          <span>{total} exams</span>
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
