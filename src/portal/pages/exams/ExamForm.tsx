import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import { FieldWrap, Input, Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { useClasses, useYears } from '../../api/lookups'
import { Btn, NoAcademicYear, PageHeader, errorText } from '../../ui'
import { EXAM_TYPES, type ExamType } from './common'

type Detail = Schemas['ExamDetailDto']
type Paper = {
  key: string
  subjectId: string
  maxMarks: string
  passMarks: string
  examDate: string
}
const blankPaper = (max = '25', pass = '9'): Paper => ({
  key: crypto.randomUUID(),
  subjectId: '',
  maxMarks: max,
  passMarks: pass,
  examDate: '',
})

export function ExamForm() {
  const { id } = useParams()
  const exam = useQuery({
    queryKey: ['exams', id],
    queryFn: () => api<Detail>(`/exams/${id}`),
    enabled: !!id,
  })
  if (id && exam.isPending)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    )
  if (id && exam.isError)
    return (
      <p className="text-sm text-red-700">{errorText(exam.error, "Couldn't load this exam.")}</p>
    )
  return <Body exam={exam.data} />
}

function Body({ exam }: { exam?: Detail }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const years = useYears()
  const yearId = exam?.academicYearId ?? years.current?.id ?? ''
  const classes = useClasses(yearId)
  const subjects = useQuery({
    queryKey: ['subjects', 'active'],
    queryFn: () =>
      api<Schemas['PaginatedSubjectsDto']>('/subjects', { query: { isActive: true, limit: 100 } }),
  })
  const scales = useQuery({
    queryKey: ['grade-scales'],
    queryFn: () =>
      api<Schemas['PaginatedGradeScalesDto']>('/grade-scales', { query: { limit: 100 } }),
  })
  const defaultScale = scales.data?.items.find((s) => s.isDefault)?.id ?? ''

  const [type, setType] = useState<ExamType>(exam?.type ?? 'WEEKLY_TEST')
  const [name, setName] = useState(exam?.name ?? '')
  const [classId, setClassId] = useState(exam?.classId ?? '')
  const [startDate, setStartDate] = useState(exam?.startDate?.slice(0, 10) ?? '')
  const [endDate, setEndDate] = useState(exam?.endDate?.slice(0, 10) ?? '')
  const [scalePick, setScale] = useState(exam?.gradeScaleId ?? '')
  const scaleId = scalePick || defaultScale
  const [papers, setPapers] = useState<Paper[]>(
    exam?.subjects.length
      ? exam.subjects.map((s) => ({
          key: s.id,
          subjectId: s.subjectId,
          maxMarks: String(s.maxMarks),
          passMarks: String(s.passMarks),
          examDate: s.examDate?.slice(0, 10) ?? '',
        }))
      : [blankPaper()]
  )
  const hasMarks = !!exam?.subjects.some((s) => s.enteredCount > 0)
  // Existing papers keep their exam-subject id as `key`.
  const withMarks = new Set(exam?.subjects.filter((s) => s.enteredCount > 0).map((s) => s.id))
  const createdId = useRef<string | null>(null)

  const setPaper = (key: string, patch: Partial<Paper>) =>
    setPapers((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)))
  const paperError = (p: Paper) => {
    const max = Number(p.maxMarks)
    const pass = Number(p.passMarks)
    if (!p.subjectId) return 'Pick a subject'
    if (!Number.isFinite(max) || max <= 0) return 'Max marks must be above 0'
    // Number('') is 0, so a blank field has to be caught on its own.
    if (p.passMarks.trim() === '' || !Number.isFinite(pass) || pass < 0) return 'Enter pass marks'
    if (pass > max) return "Pass marks can't be more than max"
    if (startDate && p.examDate && p.examDate < startDate)
      return 'Paper date is before the exam starts'
    return null
  }
  const duplicate = papers.map((p) => p.subjectId).filter((s, i, a) => s && a.indexOf(s) !== i)

  const save = useMutation({
    mutationFn: async () => {
      const details = {
        name: name.trim(),
        type,
        gradeScaleId: scaleId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
      // Two requests: if the papers PUT fails after the POST worked, a retry must update
      // that exam instead of creating a second one.
      const existingId = exam?.id ?? createdId.current
      const saved = existingId
        ? await api<Detail>(`/exams/${existingId}`, { method: 'PATCH', body: details })
        : await api<Detail>('/exams', {
            method: 'POST',
            body: { ...details, academicYearId: yearId, classId },
          })
      createdId.current = saved.id
      return api<Detail>(`/exams/${saved.id}/subjects`, {
        method: 'PUT',
        body: {
          subjects: papers.map((p) => ({
            subjectId: p.subjectId,
            maxMarks: Number(p.maxMarks),
            passMarks: Number(p.passMarks),
            examDate: p.examDate || undefined,
          })),
        },
      })
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['exams'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(exam ? 'Exam saved' : `Created ${d.name}. Enter marks for each paper next.`)
      navigate(`/admin/exams/${d.id}`)
    },
    onError: (err) => toast.error(errorText(err)),
  })

  const problem = !name.trim()
    ? 'Enter the exam name.'
    : !classId
      ? 'Pick the class.'
      : endDate && startDate && endDate < startDate
        ? 'End date is before the start date.'
        : !papers.length
          ? 'Add at least one paper.'
          : duplicate.length
            ? 'Each subject can appear only once.'
            : papers.some(paperError)
              ? 'Fix the papers marked below.'
              : null

  const seg = (on: boolean) =>
    `min-h-11 rounded-full border px-5 text-sm font-medium ${on ? 'border-brand bg-tint-blue text-brand' : 'border-border text-content bg-white'}`
  const activeSubjects = subjects.data?.items ?? []

  // A new exam goes into the current year (an existing one carries its own).
  if (!exam && !years.isPending && !years.current)
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Create exam" />
        <NoAcademicYear error={years.error}>
          Exams are created for a class in an academic year. Add the year, its classes and subjects
          first.
        </NoAcademicYear>
      </div>
    )

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="text-muted flex gap-2 text-[13px]">
        <Link to="/admin/exams" className="hover:text-brand">
          Exams
        </Link>
        <span aria-hidden>/</span>
        {exam ? (
          <>
            <Link to={`/admin/exams/${exam.id}`} className="hover:text-brand">
              {exam.name}
            </Link>
            <span aria-hidden>/</span>
            <span>Edit</span>
          </>
        ) : (
          <span>Create exam</span>
        )}
      </nav>
      <PageHeader
        title={exam ? `Edit ${exam.name}` : 'Create exam'}
        sub={
          exam
            ? `${exam.classStandard}`
            : 'It starts as a draft. Students see nothing until you publish results.'
        }
      />

      <section className="dt flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="font-display text-heading text-[17px] font-semibold">Details</h2>
        <div role="group" aria-label="Exam type" className="flex flex-wrap gap-2">
          {(Object.keys(EXAM_TYPES) as ExamType[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              className={seg(type === t)}
              onClick={() => setType(t)}
            >
              {EXAM_TYPES[t]}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldWrap label="Name" htmlFor="ex-name" required>
            <Input
              id="ex-name"
              placeholder={type === 'SEMESTER' ? 'Semester 1' : 'Weekly Test 7'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FieldWrap>
          <FieldWrap
            label="Class"
            htmlFor="ex-class"
            required
            hint={exam ? "The class can't change after the exam is created." : undefined}
          >
            <Select
              id="ex-class"
              value={classId}
              disabled={!!exam}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Choose a class…</option>
              {classes.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.standard}
                </option>
              ))}
            </Select>
          </FieldWrap>
          <FieldWrap label="Grade scale" htmlFor="ex-scale">
            <Select id="ex-scale" value={scaleId} onChange={(e) => setScale(e.target.value)}>
              <option value="">No grades (marks only)</option>
              {(scales.data?.items ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </Select>
          </FieldWrap>
          <FieldWrap label="Starts" htmlFor="ex-start">
            <Input
              id="ex-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FieldWrap>
          <FieldWrap
            label="Ends"
            htmlFor="ex-end"
            error={
              endDate && startDate && endDate < startDate
                ? 'Must be on or after the start date'
                : undefined
            }
          >
            <Input
              id="ex-end"
              type="date"
              min={startDate || undefined}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FieldWrap>
        </div>
      </section>

      <section className="dt flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-heading text-[17px] font-semibold">Papers</h2>
          {hasMarks && (
            <span className="text-[13px] text-amber-700">
              Marks are already entered. Changing max or pass marks affects results.
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Subject</th>
                <th className="text-right!">Max marks</th>
                <th className="text-right!">Pass marks</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {papers.map((p) => {
                const err =
                  (p.subjectId || p.maxMarks !== '25' || p.passMarks !== '9') && paperError(p)
                const dup = duplicate.includes(p.subjectId)
                return (
                  <tr key={p.key}>
                    <td className="min-w-52">
                      <Select
                        aria-label="Subject"
                        value={p.subjectId}
                        onChange={(e) => setPaper(p.key, { subjectId: e.target.value })}
                        error={dup ? 'dup' : undefined}
                      >
                        <option value="">Choose…</option>
                        {activeSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                      {(err || dup) && (
                        <span role="alert" className="mt-1 block text-xs font-medium text-red-600">
                          {dup ? 'This subject is already listed' : err}
                        </span>
                      )}
                    </td>
                    <td className="w-32">
                      <Input
                        aria-label="Max marks"
                        inputMode="numeric"
                        value={p.maxMarks}
                        onChange={(e) =>
                          setPaper(p.key, { maxMarks: e.target.value.replace(/[^\d.]/g, '') })
                        }
                        className="text-right tabular-nums"
                      />
                    </td>
                    <td className="w-32">
                      <Input
                        aria-label="Pass marks"
                        inputMode="numeric"
                        value={p.passMarks}
                        onChange={(e) =>
                          setPaper(p.key, { passMarks: e.target.value.replace(/[^\d.]/g, '') })
                        }
                        className="text-right tabular-nums"
                      />
                    </td>
                    <td className="w-44">
                      <Input
                        aria-label="Paper date"
                        type="date"
                        value={p.examDate}
                        onChange={(e) => setPaper(p.key, { examDate: e.target.value })}
                      />
                    </td>
                    <td>
                      <div className="ra">
                        <button
                          type="button"
                          className="danger disabled:cursor-not-allowed disabled:opacity-40"
                          // The API refuses to drop a paper that has marks (409), after the
                          // exam details were already saved. Block it here instead.
                          disabled={withMarks.has(p.key)}
                          aria-label={
                            withMarks.has(p.key)
                              ? 'This paper has marks and can’t be removed'
                              : 'Remove paper'
                          }
                          title={
                            withMarks.has(p.key)
                              ? 'This paper has marks and can’t be removed'
                              : undefined
                          }
                          onClick={() => setPapers((ps) => ps.filter((x) => x.key !== p.key))}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <Btn
          variant="outline"
          className="self-start"
          onClick={() =>
            setPapers((ps) => [...ps, blankPaper(ps.at(-1)?.maxMarks, ps.at(-1)?.passMarks)])
          }
        >
          <Plus className="h-4 w-4" aria-hidden /> Add paper
        </Btn>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {problem && <span className="text-[13px] text-amber-700">{problem}</span>}
        <Link
          to={exam ? `/admin/exams/${exam.id}` : '/admin/exams'}
          className="border-border text-heading hover:border-brand hover:text-brand inline-flex min-h-11 items-center rounded-full border bg-white px-5 text-sm font-medium"
        >
          Cancel
        </Link>
        <Btn busy={save.isPending} disabled={!!problem} onClick={() => save.mutate()}>
          {exam ? 'Save exam' : 'Create exam'}
        </Btn>
      </div>
    </div>
  )
}
