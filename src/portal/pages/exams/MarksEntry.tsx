import { useEffect, useRef, useState } from 'react'
import { Link, useBlocker, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'
import { api, type Schemas } from '../../api/client'
import { Btn, ConfirmDialog, errorText } from '../../ui'
import { ExamStatus } from './common'

type Sheet = Schemas['MarksSheetDto']
type Cell = { marks: string; absent: boolean }

export function MarksEntry() {
  const { id = '', paperId = '' } = useParams()
  const exam = useQuery({
    queryKey: ['exams', id],
    queryFn: () => api<Schemas['ExamDetailDto']>(`/exams/${id}`),
  })
  const sheet = useQuery({
    queryKey: ['exams', id, 'marks', paperId],
    queryFn: () => api<Sheet>(`/exams/${id}/marks`, { query: { examSubjectId: paperId } }),
  })

  if (exam.isPending || sheet.isPending)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    )
  if (exam.isError || sheet.isError)
    return (
      <p className="text-sm text-red-700">
        {errorText(exam.error ?? sheet.error, "Couldn't load the marks.")}
      </p>
    )
  // key: start from the saved marks again whenever another paper opens or a save comes back
  return <Grid key={`${paperId}-${sheet.dataUpdatedAt}`} exam={exam.data} sheet={sheet.data} />
}

function Grid({ exam, sheet }: { exam: Schemas['ExamDetailDto']; sheet: Sheet }) {
  const qc = useQueryClient()
  const paper = sheet.examSubject
  const rows = [...sheet.rows].sort(
    (a, b) => (a.rollNo ?? 9999) - (b.rollNo ?? 9999) || a.name.localeCompare(b.name)
  )
  // The saved state. Updated as soon as a save succeeds, so leaving the page right away
  // doesn't warn about "unsaved" marks while the sheet is still refetching.
  const [original, setOriginal] = useState<Record<string, Cell>>(() =>
    Object.fromEntries(
      rows.map((r) => [
        r.studentId,
        { marks: r.marksObtained === null ? '' : String(r.marksObtained), absent: r.isAbsent },
      ])
    )
  )
  const [cells, setCells] = useState<Record<string, Cell>>(original)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const errorOf = (c: Cell) => {
    if (c.absent || c.marks === '') return null
    const n = Number(c.marks)
    if (!/^\d+(\.\d{1,2})?$/.test(c.marks) || !Number.isFinite(n)) return 'Numbers only'
    if (n > paper.maxMarks) return `Can't be more than ${paper.maxMarks}`
    return null
  }
  const changed = rows.filter((r) => {
    const c = cells[r.studentId]
    const o = original[r.studentId]
    return c.absent !== o.absent || c.marks !== o.marks
  })
  const invalid = rows.filter((r) => errorOf(cells[r.studentId]))
  const entered = rows.filter(
    (r) => cells[r.studentId].absent || cells[r.studentId].marks !== ''
  ).length
  const dirty = changed.length > 0

  const save = useMutation({
    mutationFn: () =>
      api<Schemas['SaveMarksResultDto']>(`/exams/${exam.id}/subjects/${paper.id}/marks`, {
        method: 'PUT',
        body: {
          marks: changed
            // A cleared cell can't be saved as "no mark"; only rows with a value or Absent go up.
            .filter((r) => cells[r.studentId].absent || cells[r.studentId].marks !== '')
            .map((r) => {
              const c = cells[r.studentId]
              return c.absent
                ? { studentId: r.studentId, isAbsent: true }
                : { studentId: r.studentId, isAbsent: false, marksObtained: Number(c.marks) }
            }),
        },
      }),
    onSuccess: (r) => {
      setOriginal(cells)
      toast.success(
        `Saved ${r.saved} ${r.saved === 1 ? 'mark' : 'marks'} · ${r.enteredCount} of ${r.totalStudents} entered`
      )
      qc.invalidateQueries({ queryKey: ['exams', exam.id] })
      qc.invalidateQueries({ queryKey: ['exams'], exact: false, refetchType: 'none' })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => toast.error(errorText(err)),
  })

  // Don't hold the user while a save is in flight: it finishes even after they leave.
  const unsaved = dirty && !save.isPending
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      unsaved && currentLocation.pathname !== nextLocation.pathname
  )
  useEffect(() => {
    if (!unsaved) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  const set = (studentId: string, patch: Partial<Cell>) =>
    setCells((c) => ({ ...c, [studentId]: { ...c[studentId], ...patch } }))
  const focus = (i: number) => {
    const el = inputs.current[Math.max(0, Math.min(rows.length - 1, i))]
    el?.focus()
    el?.select()
  }

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="text-muted flex flex-wrap gap-2 text-[13px]">
        <Link to="/admin/exams" className="hover:text-brand">
          Exams
        </Link>
        <span aria-hidden>/</span>
        <Link to={`/admin/exams/${exam.id}`} className="hover:text-brand">
          {exam.name} · {exam.classStandard}
        </Link>
        <span aria-hidden>/</span>
        <span>{paper.subjectName}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <span className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-heading text-[28px] font-semibold">
            {exam.name} · {exam.classStandard}
          </h1>
          <ExamStatus exam={exam} />
        </span>
        <Link
          to={`/admin/exams/${exam.id}`}
          className="border-border text-heading hover:border-brand hover:text-brand inline-flex min-h-11 items-center rounded-full border bg-white px-5 text-sm font-medium"
        >
          Back to exam
        </Link>
      </div>

      <nav aria-label="Papers" className="flex gap-2 overflow-x-auto pb-1">
        {exam.subjects.map((s) => {
          const on = s.id === paper.id
          const done = s.totalStudents > 0 && s.enteredCount >= s.totalStudents
          return (
            <Link
              key={s.id}
              to={`/admin/exams/${exam.id}/marks/${s.id}`}
              aria-current={on ? 'page' : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap ${on ? 'border-brand bg-brand text-white' : 'border-border text-content bg-white hover:border-blue-300'}`}
            >
              {done && !on && (
                <Check className="h-3.5 w-3.5 text-green-600" strokeWidth={3} aria-hidden />
              )}
              {s.subjectName}
              {!done && (
                <span className={on ? 'text-blue-100' : 'text-muted'}>
                  · {s.enteredCount}/{s.totalStudents}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {exam.status === 'PUBLISHED' && (
        <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Results are published. Changes here show to students only after you publish again.
        </p>
      )}

      <section className="dt">
        <div className="dt-bar">
          <div className="flex flex-wrap gap-5 text-sm">
            <span>
              <span className="text-muted">Max marks</span>{' '}
              <b className="text-heading">{paper.maxMarks}</b>
            </span>
            <span>
              <span className="text-muted">Pass marks</span>{' '}
              <b className="text-heading">{paper.passMarks}</b>
            </span>
            <span>
              <span className="text-muted">Entered</span>{' '}
              <b className="text-heading">
                {entered} of {rows.length}
              </b>
            </span>
          </div>
          <span className="text-muted text-[13px]">
            Enter or ↓ moves to the next student. Type A to mark absent.
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-16">Roll</th>
                <th>Student</th>
                <th className="text-right!">Marks / {paper.maxMarks}</th>
                <th>Absent</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="text-muted py-8 text-center text-sm">
                    No students are enrolled in {exam.classStandard}.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => {
                const c = cells[r.studentId]
                const o = original[r.studentId]
                const err = errorOf(c)
                const isChanged = c.absent !== o.absent || c.marks !== o.marks
                const fail =
                  !c.absent && c.marks !== '' && !err && Number(c.marks) < paper.passMarks
                const note = err
                  ? err
                  : c.absent
                    ? 'Absent counts as 0 and fails the paper'
                    : c.marks === ''
                      ? 'Not entered'
                      : isChanged
                        ? 'Unsaved'
                        : fail
                          ? 'Below pass marks'
                          : ''
                return (
                  <tr
                    key={r.studentId}
                    className={err ? 'bg-red-50' : c.absent ? 'bg-pink-50/50' : undefined}
                  >
                    <td className="text-muted tabular-nums">{r.rollNo ?? '—'}</td>
                    <td>
                      <span className="flex flex-col">
                        <b className="text-heading font-semibold">{r.name}</b>
                        <small className="text-muted font-mono text-xs">{r.admissionNo}</small>
                      </span>
                    </td>
                    <td className="text-right">
                      <input
                        ref={(el) => {
                          inputs.current[i] = el
                        }}
                        aria-label={`Marks for ${r.name}`}
                        aria-invalid={!!err}
                        inputMode="decimal"
                        disabled={c.absent}
                        value={c.absent ? '' : c.marks}
                        placeholder={c.absent ? 'AB' : ''}
                        onChange={(e) => set(r.studentId, { marks: e.target.value.trim() })}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'ArrowDown') {
                            e.preventDefault()
                            focus(i + 1)
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            focus(i - 1)
                          } else if (e.key.toLowerCase() === 'a') {
                            e.preventDefault()
                            set(r.studentId, { absent: true, marks: '' })
                            focus(i + 1)
                          }
                        }}
                        className={`focus:border-brand min-h-10 w-24 rounded-[10px] border px-3 text-right text-[15px] font-semibold tabular-nums outline-none ${
                          err
                            ? 'border-red-500 bg-white text-red-700'
                            : c.absent
                              ? 'border-dashed border-slate-200 bg-slate-50 text-slate-400'
                              : c.marks === ''
                                ? 'border-amber-300 bg-amber-50'
                                : isChanged
                                  ? 'border-blue-300 bg-blue-50'
                                  : fail
                                    ? 'border-border text-red-700'
                                    : 'border-border text-heading'
                        }`}
                      />
                    </td>
                    <td>
                      <label className="flex min-h-10 cursor-pointer items-center gap-2 text-[13px]">
                        <input
                          type="checkbox"
                          className="h-4.5 w-4.5 accent-pink-700"
                          checked={c.absent}
                          onChange={(e) =>
                            set(r.studentId, {
                              absent: e.target.checked,
                              marks: e.target.checked ? '' : c.marks,
                            })
                          }
                        />
                        Absent
                      </label>
                    </td>
                    <td
                      className={`text-[13px] font-medium ${err || fail ? 'text-red-700' : c.absent ? 'text-pink-700' : c.marks === '' ? 'text-amber-700' : 'text-brand'}`}
                    >
                      {note}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="bg-brand-dark sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-full px-5 py-3 text-white shadow-[0_12px_32px_-12px_rgba(29,78,216,0.5)]">
        <span className="text-sm">
          {dirty ? (
            <>
              <b>
                {changed.length} unsaved {changed.length === 1 ? 'change' : 'changes'}
              </b>
              {invalid.length > 0 &&
                ` · ${invalid.length} ${invalid.length === 1 ? 'needs' : 'need'} fixing before you can save`}
            </>
          ) : (
            'All changes saved'
          )}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!dirty}
            onClick={() => setCells(original)}
            className="min-h-10 rounded-full border border-white/35 px-4 text-sm font-medium disabled:opacity-50"
          >
            Discard
          </button>
          <Btn
            variant="accent"
            busy={save.isPending}
            disabled={!dirty || invalid.length > 0}
            onClick={() => save.mutate()}
            className="min-h-10"
          >
            Save marks
          </Btn>
        </div>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title="Leave without saving?"
        body={`${changed.length} ${changed.length === 1 ? 'mark is' : 'marks are'} not saved and will be lost.`}
        confirmLabel="Leave without saving"
        onConfirm={() => blocker.proceed?.()}
      />
    </div>
  )
}
