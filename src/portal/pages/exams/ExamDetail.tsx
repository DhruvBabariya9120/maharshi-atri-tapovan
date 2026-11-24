import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Circle, Loader2, Pencil, Trash2 } from 'lucide-react'
import { api, type Schemas } from '../../api/client'
import { Btn, ConfirmDialog, Dialog, errorText, fmtDate } from '../../ui'
import { ProgressBar } from '../fees/common'
import { EXAM_TYPES, ExamStatus, dateRange } from './common'

type Detail = Schemas['ExamDetailDto']

export function ExamDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const exam = useQuery({ queryKey: ['exams', id], queryFn: () => api<Detail>(`/exams/${id}`) })
  const scales = useQuery({
    queryKey: ['grade-scales'],
    queryFn: () =>
      api<Schemas['PaginatedGradeScalesDto']>('/grade-scales', { query: { limit: 100 } }),
  })
  const [publishing, setPublishing] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['exams'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const publish = useMutation({
    mutationFn: () =>
      api<Schemas['PublishExamResultDto']>(`/exams/${id}/publish`, { method: 'POST' }),
    onSuccess: (r) => {
      toast.success(`Published results for ${r.resultsCount} students`)
      setPublishing(false)
      refresh()
      navigate(`/admin/exams/${id}/results`)
    },
    onError: (err) => {
      setPublishing(false)
      toast.error(errorText(err))
    },
  })
  const unpublish = useMutation({
    mutationFn: () => api(`/exams/${id}/unpublish`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Results hidden from students. The exam is a draft again.')
      setUnpublishing(false)
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const remove = useMutation({
    mutationFn: () => api(`/exams/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Exam deleted')
      refresh()
      navigate('/admin/exams', { replace: true })
    },
    onError: (err) => {
      setDeleting(false)
      toast.error(errorText(err))
    },
  })

  if (exam.isPending)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    )
  if (exam.isError)
    return (
      <p className="text-sm text-red-700">{errorText(exam.error, "Couldn't load this exam.")}</p>
    )
  const e = exam.data
  const scale = scales.data?.items.find((s) => s.id === e.gradeScaleId)
  const allEntered =
    e.subjects.length > 0 &&
    e.subjects.every((s) => s.totalStudents > 0 && s.enteredCount >= s.totalStudents)
  const missing = e.subjects.filter((s) => s.enteredCount < s.totalStudents)
  const checks = [
    {
      ok: e.subjects.length > 0,
      label: e.subjects.length
        ? `${e.subjects.length} ${e.subjects.length === 1 ? 'paper' : 'papers'} added`
        : 'Add at least one paper',
    },
    {
      ok: allEntered,
      label: allEntered
        ? 'Marks entered for every student'
        : `Marks missing in ${missing.length} ${missing.length === 1 ? 'paper' : 'papers'}`,
    },
    {
      ok: !!e.gradeScaleId,
      label: scale ? `Grade scale: ${scale.name}` : 'No grade scale. Results show marks only.',
      soft: true,
    },
  ]
  const published = e.status === 'PUBLISHED'

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="text-muted flex gap-2 text-[13px]">
        <Link to="/admin/exams" className="hover:text-brand">
          Exams
        </Link>
        <span aria-hidden>/</span>
        <span>{e.name}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-heading text-[28px] font-semibold">
              {e.name} · {e.classStandard}
            </h1>
            <ExamStatus exam={e} />
          </span>
          <p className="text-muted text-sm">
            {EXAM_TYPES[e.type]} · {dateRange(e.startDate, e.endDate)}
            {e.publishedAt &&
              ` · published ${fmtDate(e.publishedAt)}${e.publishCount > 1 ? ` (${e.publishCount} times)` : ''}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {published ? (
            <>
              <Link
                to={`/admin/exams/${id}/results`}
                className="border-border text-heading hover:border-brand hover:text-brand inline-flex min-h-11 items-center rounded-full border bg-white px-5 text-sm font-medium"
              >
                View results
              </Link>
              <Btn variant="outline" onClick={() => setUnpublishing(true)}>
                Unpublish
              </Btn>
              {e.changedSinceLastPublish && (
                <Btn onClick={() => setPublishing(true)} disabled={!allEntered}>
                  Publish again
                </Btn>
              )}
            </>
          ) : (
            <Btn
              onClick={() => setPublishing(true)}
              disabled={!allEntered}
              title={allEntered ? undefined : 'Enter marks for every paper first'}
            >
              Publish results
            </Btn>
          )}
          <Link
            to={`/admin/exams/${id}/edit`}
            className="border-border text-heading hover:border-brand hover:text-brand inline-flex min-h-11 items-center gap-2 rounded-full border bg-white px-5 text-sm font-medium"
          >
            <Pencil className="h-4 w-4" aria-hidden /> Edit
          </Link>
        </div>
      </div>

      {published && e.changedSinceLastPublish && (
        <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <b>Marks changed after the last publish.</b> Students still see the old results. Publish
          again to update ranks and grades.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-5">
        <section className="dt min-w-0 flex-[3_1_520px]">
          <div className="dt-bar">
            <h2 className="dt-title">
              Papers <span className="dt-count">{e.subjects.length}</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Date</th>
                  <th className="text-right!">Max / pass</th>
                  <th>Marks entered</th>
                  <th className="text-right!" />
                </tr>
              </thead>
              <tbody>
                {!e.subjects.length && (
                  <tr>
                    <td colSpan={5} className="text-muted py-8 text-center text-sm">
                      No papers yet.{' '}
                      <Link to={`/admin/exams/${id}/edit`} className="text-brand">
                        Add papers
                      </Link>
                    </td>
                  </tr>
                )}
                {e.subjects.map((s) => {
                  const done = s.totalStudents > 0 && s.enteredCount >= s.totalStudents
                  const p = s.totalStudents
                    ? Math.round((s.enteredCount / s.totalStudents) * 100)
                    : 0
                  return (
                    <tr key={s.id}>
                      <td className="text-heading font-semibold">{s.subjectName}</td>
                      <td className="text-muted whitespace-nowrap">
                        {s.examDate ? fmtDate(s.examDate) : '—'}
                      </td>
                      <td className="text-right whitespace-nowrap tabular-nums">
                        {s.maxMarks} / {s.passMarks}
                      </td>
                      <td className="min-w-48">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1">
                            <ProgressBar percent={p} tone={done ? 'green' : 'blue'} />
                          </div>
                          <span
                            className={`text-xs whitespace-nowrap tabular-nums ${done ? 'font-medium text-green-700' : 'text-muted'}`}
                          >
                            {s.enteredCount} of {s.totalStudents}
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/admin/exams/${id}/marks/${s.id}`}
                          className="text-brand text-[13px] font-semibold whitespace-nowrap"
                        >
                          {s.enteredCount ? 'Edit marks' : 'Enter marks'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="dt flex min-w-0 flex-[1_1_280px] flex-col gap-3.5 p-5">
          <h2 className="font-display text-heading text-[17px] font-semibold">
            {published ? 'Status' : 'Before you publish'}
          </h2>
          {checks.map((c) => (
            <span
              key={c.label}
              className={`flex items-start gap-2.5 text-sm ${c.ok ? 'text-heading' : c.soft ? 'text-muted' : 'text-amber-800'}`}
            >
              {c.ok ? (
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                  strokeWidth={3}
                  aria-hidden
                />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              )}
              {c.label}
            </span>
          ))}
          {!published && (
            <button
              type="button"
              onClick={() => setDeleting(true)}
              className="mt-2 inline-flex min-h-6 items-center gap-1.5 self-start text-[13px] font-medium text-red-700 hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete exam
            </button>
          )}
        </aside>
      </div>

      <Dialog
        open={publishing}
        onClose={() => setPublishing(false)}
        title={published ? 'Publish again?' : 'Publish results?'}
        footer={
          <>
            <Btn variant="outline" onClick={() => setPublishing(false)}>
              Cancel
            </Btn>
            <Btn busy={publish.isPending} onClick={() => publish.mutate()}>
              Publish to students
            </Btn>
          </>
        }
      >
        <p>
          Totals, percentages, grades and ranks are worked out for every student in{' '}
          {e.classStandard}. Students and parents see them in the portal straight away.
        </p>
        <p>You can still edit marks later. Changes show only after you publish again.</p>
      </Dialog>
      <ConfirmDialog
        open={unpublishing}
        onClose={() => setUnpublishing(false)}
        title="Unpublish results?"
        body="Students stop seeing this exam's results, and it goes back to draft. Marks are kept."
        confirmLabel="Unpublish"
        busy={unpublish.isPending}
        onConfirm={() => unpublish.mutate()}
      />
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title={`Delete ${e.name}?`}
        body="The exam, its papers and every mark entered are removed for good."
        confirmLabel="Delete exam"
        busy={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}
