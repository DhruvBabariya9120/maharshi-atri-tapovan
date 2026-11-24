import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { api, type Schemas } from '../../api/client'
import { PageHeader, Pill, errorText, fmtDate } from '../../ui'
import { ProgressBar } from '../fees/common'
import { EXAM_TYPES, ordinal, pctText } from '../exams/common'

export function MyResults() {
  const [params, setParams] = useSearchParams()
  const list = useQuery({
    queryKey: ['me', 'results'],
    queryFn: () => api<Schemas['ResultListItemDto'][]>('/me/results'),
  })
  const items = [...(list.data ?? [])].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const examId = params.get('exam') ?? items[0]?.examId ?? ''
  const detail = useQuery({
    queryKey: ['me', 'results', examId],
    queryFn: () => api<Schemas['ResultDetailDto']>(`/me/results/${examId}`),
    enabled: !!examId,
  })

  if (list.isPending) return <div className="dt h-60 animate-pulse" />
  if (list.isError)
    return (
      <p className="text-sm text-red-700">{errorText(list.error, "Couldn't load your results.")}</p>
    )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="My results" sub="Results appear here once the school publishes them." />
      {!items.length ? (
        <div className="dt text-muted p-10 text-center text-sm">No published results yet.</div>
      ) : (
        <div className="flex flex-wrap items-start gap-5">
          <nav aria-label="Exams" className="flex w-full flex-col gap-2.5 md:w-72">
            {items.map((r) => {
              const on = r.examId === examId
              return (
                <button
                  key={r.examId}
                  type="button"
                  aria-current={on ? 'true' : undefined}
                  onClick={() => setParams({ exam: r.examId }, { replace: true })}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left ${on ? 'border-brand bg-tint-blue-soft' : 'border-border bg-white hover:border-blue-300'}`}
                >
                  <span className="flex flex-col">
                    <b className="text-heading text-sm">{r.examName}</b>
                    <small className="text-muted text-xs">
                      {EXAM_TYPES[r.type]} · {fmtDate(r.publishedAt)}
                    </small>
                  </span>
                  <b className={`text-sm tabular-nums ${r.isPass ? 'text-brand' : 'text-red-700'}`}>
                    {pctText(r.percentage)}
                  </b>
                </button>
              )
            })}
          </nav>

          <section className="dt flex min-w-0 flex-[3_1_520px] flex-col gap-5 p-5 sm:p-6">
            {detail.isPending ? (
              <div className="grid place-items-center py-16">
                <Loader2 className="text-brand h-7 w-7 animate-spin" />
              </div>
            ) : detail.isError ? (
              <p className="text-sm text-red-700">
                {errorText(detail.error, "Couldn't load this result.")}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-display text-heading text-[22px] font-semibold">
                      {detail.data.examName}
                    </h2>
                    <span className="text-muted text-[13px]">
                      {EXAM_TYPES[detail.data.type]} · {detail.data.academicYearName} · published{' '}
                      {fmtDate(detail.data.publishedAt)}
                    </span>
                  </div>
                  {detail.data.isPass ? (
                    <Pill tone="green">Pass</Pill>
                  ) : (
                    <Pill tone="red">Fail</Pill>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    [
                      'Total',
                      `${detail.data.totalObtained} / ${detail.data.totalMax}`,
                      'bg-tint-blue-soft text-brand',
                    ],
                    ['Percentage', pctText(detail.data.percentage), 'bg-tint-blue-soft text-brand'],
                    ['Grade', detail.data.grade ?? '—', 'bg-tint-blue-soft text-brand'],
                    [
                      'Rank',
                      `${ordinal(detail.data.rank)} of ${detail.data.classSize}`,
                      'bg-tint-pink-soft text-accent-ink',
                    ],
                  ].map(([label, value, tone]) => (
                    <div key={label} className={`flex flex-col gap-1 rounded-2xl p-4 ${tone}`}>
                      <span className="text-content text-xs">{label}</span>
                      <span className="font-display text-xl font-semibold tabular-nums">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th className="text-right!">Marks</th>
                        <th className="w-2/5" />
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.data.subjects.map((s) => (
                        <tr key={s.examSubjectId}>
                          <td className="text-heading font-medium">{s.subjectName}</td>
                          <td className="text-heading text-right font-semibold whitespace-nowrap tabular-nums">
                            {s.isAbsent ? 'Absent' : `${s.marksObtained ?? '—'} / ${s.maxMarks}`}
                          </td>
                          <td>
                            <ProgressBar
                              percent={
                                s.isAbsent || s.marksObtained === null
                                  ? 0
                                  : Math.round((s.marksObtained / s.maxMarks) * 100)
                              }
                              tone={s.isPass ? 'blue' : 'red'}
                            />
                          </td>
                          <td
                            className={`text-[13px] font-medium ${s.isPass ? 'text-green-700' : 'text-red-700'}`}
                          >
                            {s.isPass ? 'Pass' : 'Fail'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-muted text-[13px]">
                  Questions about marks? Speak to your class teacher.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
