import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Loader2, Search } from 'lucide-react'
import { api, type Schemas } from '../../api/client'
import { Pill, errorText, fmtDate } from '../../ui'
import { ProgressBar } from '../fees/common'
import { ExamStatus, pctText } from './common'

const MEDAL: Record<number, string> = {
  1: 'bg-amber-100 text-amber-800',
  2: 'bg-slate-200 text-slate-700',
  3: 'bg-orange-100 text-orange-800',
}

export function ExamResults() {
  const { id = '' } = useParams()
  const exam = useQuery({
    queryKey: ['exams', id],
    queryFn: () => api<Schemas['ExamDetailDto']>(`/exams/${id}`),
  })
  const results = useQuery({
    queryKey: ['exams', id, 'results'],
    queryFn: () => api<Schemas['ExamResultDto'][]>(`/exams/${id}/results`),
  })
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  if (exam.isPending || results.isPending)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    )
  if (exam.isError || results.isError)
    return (
      <p className="text-sm text-red-700">
        {errorText(exam.error ?? results.error, "Couldn't load the results.")}
      </p>
    )
  const e = exam.data
  const all = [...results.data].sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
  const rows = all.filter(
    (r) => !q || `${r.name} ${r.admissionNo}`.toLowerCase().includes(q.toLowerCase())
  )
  const passed = all.filter((r) => r.isPass).length
  const avg = all.length ? all.reduce((s, r) => s + r.percentage, 0) / all.length : 0
  const top = all[0]

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="text-muted flex gap-2 text-[13px]">
        <Link to="/admin/exams" className="hover:text-brand">
          Exams
        </Link>
        <span aria-hidden>/</span>
        <Link to={`/admin/exams/${id}`} className="hover:text-brand">
          {e.name} · {e.classStandard}
        </Link>
        <span aria-hidden>/</span>
        <span>Results</span>
      </nav>
      <div className="flex flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-heading text-[28px] font-semibold">
            Results · {e.name} · {e.classStandard}
          </h1>
          <ExamStatus exam={e} />
        </span>
        <p className="text-muted text-sm">
          {e.status === 'PUBLISHED' && e.publishedAt
            ? `Published ${fmtDate(e.publishedAt)}${e.publishCount > 1 ? `, ${e.publishCount} times` : ''}`
            : 'Not published. Students can’t see these results.'}
        </p>
      </div>
      {e.changedSinceLastPublish && (
        <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Marks changed since the last publish. These are the results students see now.{' '}
          <Link to={`/admin/exams/${id}`} className="font-semibold underline">
            Publish again
          </Link>{' '}
          to update them.
        </p>
      )}

      {!all.length ? (
        <div className="dt text-muted p-10 text-center text-sm">
          No results yet. Publish the exam to work them out.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Passed', `${passed} of ${all.length}`],
              ['Class average', pctText(avg)],
              ['Highest', top ? pctText(top.percentage) : '—'],
              ['Top student', top?.name ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="dt flex flex-col gap-1 p-5">
                <span className="text-muted text-[13px]">{label}</span>
                <span className="font-display text-heading truncate text-2xl font-semibold tabular-nums">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <section className="dt">
            <div className="dt-bar">
              <h2 className="dt-title">
                Rank list <span className="dt-count">{all.length}</span>
              </h2>
              <label className="border-border text-muted flex min-h-11 items-center gap-2 rounded-xl border bg-slate-50 px-3 text-sm">
                <Search className="h-4 w-4" aria-hidden />
                <input
                  aria-label="Find a student"
                  placeholder="Find a student"
                  value={q}
                  onChange={(ev) => setQ(ev.target.value)}
                  className="text-heading w-44 bg-transparent outline-none"
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th className="text-right!">Total</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const failed = r.subjects.filter((s) => !s.isPass)
                    const expanded = open === r.studentId
                    return [
                      <tr
                        key={r.studentId}
                        className="cursor-pointer"
                        onClick={() => setOpen(expanded ? null : r.studentId)}
                      >
                        <td>
                          <span
                            className={`inline-grid h-8 min-w-8 place-items-center rounded-lg px-1.5 text-[13px] font-bold ${MEDAL[r.rank] ?? 'text-muted'}`}
                          >
                            {r.rank}
                          </span>
                        </td>
                        <td>
                          <span className="flex items-center gap-2">
                            {expanded ? (
                              <ChevronDown className="text-muted h-4 w-4" aria-hidden />
                            ) : (
                              <ChevronRight className="text-muted h-4 w-4" aria-hidden />
                            )}
                            <span className="flex flex-col">
                              <button
                                type="button"
                                aria-expanded={expanded}
                                className="text-heading text-left font-semibold"
                              >
                                {r.name}
                              </button>
                              <small className="text-muted font-mono text-xs">
                                {r.admissionNo}
                                {r.rollNo !== null && ` · roll ${r.rollNo}`}
                              </small>
                            </span>
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap tabular-nums">
                          {r.totalObtained} / {r.totalMax}
                        </td>
                        <td className="min-w-44">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-1">
                              <ProgressBar
                                percent={r.percentage}
                                tone={r.isPass ? 'blue' : 'red'}
                              />
                            </div>
                            <span className="text-heading w-16 text-right text-[13px] font-semibold tabular-nums">
                              {pctText(r.percentage)}
                            </span>
                          </div>
                        </td>
                        <td>
                          {r.grade ? (
                            <span className="bg-tint-blue text-brand rounded-lg px-2.5 py-1 text-xs font-bold">
                              {r.grade}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <span className="flex flex-col items-start gap-1">
                            {r.isPass ? (
                              <Pill tone="green">Pass</Pill>
                            ) : (
                              <Pill tone="red">Fail</Pill>
                            )}
                            {failed.length > 0 && (
                              <small className="text-muted text-xs">
                                {failed
                                  .map((s) =>
                                    s.isAbsent
                                      ? `Absent in ${s.subjectName}`
                                      : `Below pass in ${s.subjectName}`
                                  )
                                  .join(', ')}
                              </small>
                            )}
                          </span>
                        </td>
                      </tr>,
                      expanded && (
                        <tr key={`${r.studentId}-detail`}>
                          <td colSpan={6} className="bg-tint-blue-soft!">
                            <div className="flex flex-wrap gap-2.5 py-1">
                              {r.subjects.map((s) => (
                                <span
                                  key={s.examSubjectId}
                                  className={`flex flex-col rounded-xl border bg-white px-3.5 py-2 text-xs ${s.isPass ? 'border-slate-200' : 'border-red-200'}`}
                                >
                                  <span className="text-muted">{s.subjectName}</span>
                                  <b
                                    className={`text-sm tabular-nums ${s.isPass ? 'text-heading' : 'text-red-700'}`}
                                  >
                                    {s.isAbsent
                                      ? 'Absent'
                                      : `${s.marksObtained ?? '—'} / ${s.maxMarks}`}
                                  </b>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ),
                    ]
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      <p className="text-muted text-[13px]">
        Ranks share a place on equal totals (1, 1, 3). Tap a student to see their marks in each
        paper.
      </p>
    </div>
  )
}
