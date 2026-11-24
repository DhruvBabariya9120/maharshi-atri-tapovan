import { delay, http, HttpResponse } from 'msw'
import type { Schemas } from '../api/client'
import { error } from './handlers'
import { classes, scales, subjects, years } from './setup'
import { enrollments, students } from './students'

// Dev-only P4 data: exams, papers, marks and published results.

type ExamType = Schemas['ExamDto']['type']
type Exam = Omit<Schemas['ExamDto'], 'classStandard' | 'changedSinceLastPublish'> & {
  changedSinceLastPublish: boolean
}
type Paper = {
  id: string
  examId: string
  subjectId: string
  maxMarks: number
  passMarks: number
  examDate: string | null
}
type Mark = {
  examSubjectId: string
  studentId: string
  marksObtained: number | null
  isAbsent: boolean
  remarks: string | null
}

import { mockId as id } from './ids'
const now = () => new Date().toISOString()
const body = async <T>(r: Request) => (await r.json()) as T
const current = years.find((y) => y.isCurrent)!
const classIn = (std: string) =>
  classes.find((c) => c.academicYearId === current.id && c.standard === std)!
const defaultScale = () => scales.find((s) => s.isDefault) ?? scales[0]
const ADMIN_ID = '00000000-0000-4000-8000-000000000001'
const isStudentCaller = (r: Request) => r.headers.get('Authorization')?.split('.')[1]?.endsWith('2')
const meStudent = () => students.find((s) => s.guardianEmail === 'guardian@example.com')!

const exams: Exam[] = []
const papers: Paper[] = []
const marks: Mark[] = []
/** Results as they were at the last publish; students only ever see this snapshot. */
const snapshots = new Map<string, Schemas['ExamResultDto'][]>()

const roster = (exam: Exam) => {
  const rows = enrollments.filter((e) => e.classId === exam.classId)
  return rows
    .map((e) => ({ e, s: students.find((s) => s.id === e.studentId)! }))
    .filter((x) => x.s && x.s.status === 'ACTIVE')
}
const paperDto = (p: Paper, exam: Exam): Schemas['ExamSubjectDto'] => {
  const ids = new Set(roster(exam).map((x) => x.s.id))
  return {
    id: p.id,
    subjectId: p.subjectId,
    subjectName: subjects.find((s) => s.id === p.subjectId)?.name ?? 'Subject',
    maxMarks: p.maxMarks,
    passMarks: p.passMarks,
    examDate: p.examDate,
    enteredCount: marks.filter((m) => m.examSubjectId === p.id && ids.has(m.studentId)).length,
    totalStudents: ids.size,
  }
}
const examDto = (e: Exam): Schemas['ExamDto'] => ({
  ...e,
  classStandard: classes.find((c) => c.id === e.classId)?.standard ?? '—',
})
const detailDto = (e: Exam): Schemas['ExamDetailDto'] => ({
  ...examDto(e),
  subjects: papers.filter((p) => p.examId === e.id).map((p) => paperDto(p, e)),
})

function compute(exam: Exam): Schemas['ExamResultDto'][] {
  const ps = papers.filter((p) => p.examId === exam.id)
  const scale = scales.find((s) => s.id === exam.gradeScaleId)
  const rows = roster(exam).map(({ e, s }) => {
    const subs = ps.map((p) => {
      const m = marks.find((x) => x.examSubjectId === p.id && x.studentId === s.id)
      const got = m?.isAbsent ? 0 : (m?.marksObtained ?? 0)
      return {
        examSubjectId: p.id,
        subjectName: subjects.find((x) => x.id === p.subjectId)?.name ?? 'Subject',
        maxMarks: p.maxMarks,
        passMarks: p.passMarks,
        marksObtained: m?.isAbsent ? null : (m?.marksObtained ?? null),
        isAbsent: !!m?.isAbsent,
        isPass: !m?.isAbsent && got >= p.passMarks,
      }
    })
    const totalObtained = subs.reduce((a, x) => a + (x.marksObtained ?? 0), 0)
    const totalMax = subs.reduce((a, x) => a + x.maxMarks, 0)
    const percentage = totalMax ? Math.round((totalObtained / totalMax) * 10000) / 100 : 0
    const band = scale?.bands.find((b) => percentage >= b.minPercent && percentage <= b.maxPercent)
    return {
      totalObtained,
      totalMax,
      percentage,
      grade: band?.grade ?? null,
      rank: 0,
      isPass: subs.every((x) => x.isPass) && (band ? band.isPass : true),
      studentId: s.id,
      admissionNo: s.admissionNo,
      name: `${s.firstName} ${s.lastName}`,
      rollNo: e.rollNo,
      subjects: subs,
    }
  })
  // 1, 1, 3 ranking on equal totals
  rows.sort((a, b) => b.totalObtained - a.totalObtained)
  rows.forEach(
    (r, i) =>
      (r.rank = i && r.totalObtained === rows[i - 1].totalObtained ? rows[i - 1].rank : i + 1)
  )
  return rows
}

// Seed: a published weekly test and semester, a draft with missing marks, a draft ready to publish.
const addExam = (name: string, type: ExamType, std: string, start: string, end: string | null) => {
  const e: Exam = {
    id: id(),
    academicYearId: current.id,
    classId: classIn(std).id,
    gradeScaleId: defaultScale()?.id ?? null,
    name,
    type,
    startDate: start,
    endDate: end,
    status: 'DRAFT',
    publishedAt: null,
    publishedBy: null,
    publishCount: 0,
    changedSinceLastPublish: false,
    createdAt: `${start}T09:00:00.000Z`,
  }
  exams.push(e)
  return e
}
const core = ['Gujarati', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit']
const addPapers = (e: Exam, max: number, pass: number, date: string) =>
  core.map((name) => {
    const p: Paper = {
      id: id(),
      examId: e.id,
      subjectId: subjects.find((s) => s.name === name)!.id,
      maxMarks: max,
      passMarks: pass,
      examDate: date,
    }
    papers.push(p)
    return p
  })
const fill = (e: Exam, ps: Paper[], upTo = ps.length, seed = 1) =>
  roster(e).forEach(({ s }, i) =>
    ps.slice(0, upTo).forEach((p, j) => {
      const absent = i === 3 && j === 2 && seed === 2
      const base = 0.45 + ((i * 7 + j * 3 + seed * 5) % 11) / 20
      marks.push({
        examSubjectId: p.id,
        studentId: s.id,
        isAbsent: absent,
        marksObtained: absent ? null : Math.min(p.maxMarks, Math.round(p.maxMarks * base)),
        remarks: null,
      })
    })
  )
const publishNow = (e: Exam, when: string) => {
  snapshots.set(e.id, compute(e))
  Object.assign(e, {
    status: 'PUBLISHED',
    publishedAt: when,
    publishedBy: ADMIN_ID,
    publishCount: e.publishCount + 1,
    changedSinceLastPublish: false,
  })
}
{
  const w5 = addExam('Weekly Test 5', 'WEEKLY_TEST', 'Std 8', '2026-10-17', null)
  fill(w5, addPapers(w5, 25, 9, '2026-10-17'), 6, 1)
  publishNow(w5, '2026-10-27T11:00:00.000Z')

  const sem = addExam('Semester 1', 'SEMESTER', 'Std 8', '2026-09-22', '2026-10-03')
  fill(sem, addPapers(sem, 100, 33, '2026-09-22'), 6, 2)
  publishNow(sem, '2026-10-10T11:00:00.000Z')
  // A mark changed after publishing, to show "Publish again".
  marks.find(
    (m) =>
      m.examSubjectId === papers.find((p) => p.examId === sem.id)!.id && m.marksObtained !== null
  )!.marksObtained! -= 4
  sem.changedSinceLastPublish = true

  const w6 = addExam('Weekly Test 6', 'WEEKLY_TEST', 'Std 8', '2026-10-24', null)
  fill(w6, addPapers(w6, 25, 9, '2026-10-24'), 4, 3)

  const m10 = addExam('Monthly Test · Oct', 'MONTHLY_TEST', 'Std 10', '2026-10-20', '2026-10-22')
  fill(m10, addPapers(m10, 50, 18, '2026-10-20'), 6, 4)
}

const page = <T>(items: T[], url: URL) => {
  const p = Number(url.searchParams.get('page') ?? 1)
  const limit = Number(url.searchParams.get('limit') ?? 25)
  return { items: items.slice((p - 1) * limit, p * limit), page: p, limit, total: items.length }
}
const markChanged = (e: Exam) => {
  if (e.status === 'PUBLISHED') e.changedSinceLastPublish = true
}

export const examHandlers = [
  http.get('/api/v1/exams', ({ request }) => {
    const url = new URL(request.url)
    const f = (k: string) => url.searchParams.get(k)
    const list = exams
      .filter(
        (e) =>
          (!f('academicYearId') || e.academicYearId === f('academicYearId')) &&
          (!f('classId') || e.classId === f('classId')) &&
          (!f('type') || e.type === f('type')) &&
          (!f('status') || e.status === f('status'))
      )
      .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
      .map(examDto)
    return HttpResponse.json(page(list, url))
  }),
  http.post('/api/v1/exams', async ({ request }) => {
    await delay(300)
    const b = await body<Schemas['CreateExamDto']>(request)
    if (!classes.some((c) => c.id === b.classId)) return error(404, 'Class not found')
    const e: Exam = {
      id: id(),
      academicYearId: b.academicYearId,
      classId: b.classId,
      gradeScaleId: b.gradeScaleId ?? null,
      name: b.name,
      type: b.type,
      startDate: b.startDate ?? null,
      endDate: b.endDate ?? null,
      status: 'DRAFT',
      publishedAt: null,
      publishedBy: null,
      publishCount: 0,
      changedSinceLastPublish: false,
      createdAt: now(),
    }
    exams.push(e)
    return HttpResponse.json(detailDto(e), { status: 201 })
  }),
  http.get('/api/v1/exams/:id', ({ params }) => {
    const e = exams.find((x) => x.id === params.id)
    return e ? HttpResponse.json(detailDto(e)) : error(404, 'Exam not found')
  }),
  http.patch('/api/v1/exams/:id', async ({ params, request }) => {
    const e = exams.find((x) => x.id === params.id)
    if (!e) return error(404, 'Exam not found')
    const b = await body<Schemas['UpdateExamDto']>(request)
    Object.assign(e, {
      name: b.name ?? e.name,
      type: b.type ?? e.type,
      gradeScaleId: b.gradeScaleId ?? e.gradeScaleId,
      startDate: b.startDate ?? e.startDate,
      endDate: b.endDate ?? e.endDate,
    })
    markChanged(e)
    return HttpResponse.json(detailDto(e))
  }),
  http.delete('/api/v1/exams/:id', ({ params }) => {
    const i = exams.findIndex((x) => x.id === params.id)
    if (i < 0) return error(404, 'Exam not found')
    if (exams[i].status === 'PUBLISHED')
      return error(409, 'Unpublish the results before deleting this exam')
    const ids = new Set(papers.filter((p) => p.examId === params.id).map((p) => p.id))
    exams.splice(i, 1)
    for (let j = papers.length - 1; j >= 0; j--) if (ids.has(papers[j].id)) papers.splice(j, 1)
    for (let j = marks.length - 1; j >= 0; j--)
      if (ids.has(marks[j].examSubjectId)) marks.splice(j, 1)
    return new HttpResponse(null, { status: 204 })
  }),
  http.put('/api/v1/exams/:id/subjects', async ({ params, request }) => {
    const e = exams.find((x) => x.id === params.id)
    if (!e) return error(404, 'Exam not found')
    const b = await body<Schemas['SetExamSubjectsDto']>(request)
    if (b.subjects.some((s) => s.passMarks > s.maxMarks))
      return error(400, ['subjects.passMarks must not be more than maxMarks'])
    const existing = papers.filter((p) => p.examId === e.id)
    const keep = new Set(b.subjects.map((s) => s.subjectId))
    existing
      .filter((p) => !keep.has(p.subjectId))
      .forEach((p) => {
        papers.splice(papers.indexOf(p), 1)
        for (let j = marks.length - 1; j >= 0; j--)
          if (marks[j].examSubjectId === p.id) marks.splice(j, 1)
      })
    b.subjects.forEach((s) => {
      const p = papers.find((x) => x.examId === e.id && x.subjectId === s.subjectId)
      if (p)
        Object.assign(p, {
          maxMarks: s.maxMarks,
          passMarks: s.passMarks,
          examDate: s.examDate ?? null,
        })
      else
        papers.push({
          id: id(),
          examId: e.id,
          subjectId: s.subjectId,
          maxMarks: s.maxMarks,
          passMarks: s.passMarks,
          examDate: s.examDate ?? null,
        })
    })
    markChanged(e)
    return HttpResponse.json(detailDto(e))
  }),
  http.get('/api/v1/exams/:id/marks', ({ params, request }) => {
    const e = exams.find((x) => x.id === params.id)
    const p = papers.find(
      (x) =>
        x.id === new URL(request.url).searchParams.get('examSubjectId') && x.examId === params.id
    )
    if (!e || !p) return error(404, 'Paper not found')
    return HttpResponse.json({
      examSubject: paperDto(p, e),
      rows: roster(e).map(({ e: en, s }) => {
        const m = marks.find((x) => x.examSubjectId === p.id && x.studentId === s.id)
        return {
          studentId: s.id,
          admissionNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          rollNo: en.rollNo,
          marksObtained: m?.marksObtained ?? null,
          isAbsent: !!m?.isAbsent,
          remarks: m?.remarks ?? null,
        }
      }),
    })
  }),
  http.put('/api/v1/exams/:id/subjects/:paperId/marks', async ({ params, request }) => {
    await delay(400)
    const e = exams.find((x) => x.id === params.id)
    const p = papers.find((x) => x.id === params.paperId)
    if (!e || !p) return error(404, 'Paper not found')
    const b = await body<Schemas['SaveMarksDto']>(request)
    const bad = b.marks.findIndex(
      (m) =>
        !m.isAbsent &&
        (m.marksObtained === undefined || m.marksObtained < 0 || m.marksObtained > p.maxMarks)
    )
    if (bad >= 0)
      return error(400, [`marks.${bad}.marksObtained must be between 0 and ${p.maxMarks}`])
    b.marks.forEach((m) => {
      const row = {
        examSubjectId: p.id,
        studentId: m.studentId,
        isAbsent: m.isAbsent,
        marksObtained: m.isAbsent ? null : (m.marksObtained ?? null),
        remarks: m.remarks ?? null,
      }
      const i = marks.findIndex((x) => x.examSubjectId === p.id && x.studentId === m.studentId)
      if (i >= 0) marks[i] = row
      else marks.push(row)
    })
    markChanged(e)
    const d = paperDto(p, e)
    return HttpResponse.json({
      saved: b.marks.length,
      enteredCount: d.enteredCount,
      totalStudents: d.totalStudents,
    })
  }),
  http.post('/api/v1/exams/:id/publish', async ({ params }) => {
    await delay(500)
    const e = exams.find((x) => x.id === params.id)
    if (!e) return error(404, 'Exam not found')
    const d = detailDto(e)
    if (!d.subjects.length || d.subjects.some((s) => s.enteredCount < s.totalStudents))
      return error(409, 'Enter marks for every student in every paper first')
    publishNow(e, now())
    return HttpResponse.json({ published: true, resultsCount: snapshots.get(e.id)!.length })
  }),
  http.post('/api/v1/exams/:id/unpublish', ({ params }) => {
    const e = exams.find((x) => x.id === params.id)
    if (!e) return error(404, 'Exam not found')
    Object.assign(e, { status: 'DRAFT', changedSinceLastPublish: false })
    snapshots.delete(e.id)
    return HttpResponse.json(examDto(e))
  }),
  http.get('/api/v1/exams/:id/results', ({ params }) =>
    HttpResponse.json(snapshots.get(params.id as string) ?? [])
  ),

  /* student */
  http.get('/api/v1/me/results', ({ request }) => {
    if (!isStudentCaller(request)) return error(403, 'Students only')
    const me = meStudent()
    return HttpResponse.json(
      exams
        .filter(
          (e) => e.status === 'PUBLISHED' && snapshots.get(e.id)?.some((r) => r.studentId === me.id)
        )
        .map((e) => {
          const r = snapshots.get(e.id)!.find((x) => x.studentId === me.id)!
          return {
            examId: e.id,
            examName: e.name,
            type: e.type,
            academicYearName: current.name,
            publishedAt: e.publishedAt!,
            percentage: r.percentage,
            grade: r.grade,
            rank: r.rank,
            isPass: r.isPass,
          }
        })
    )
  }),
  http.get('/api/v1/me/results/:examId', ({ params }) => {
    const e = exams.find((x) => x.id === params.examId && x.status === 'PUBLISHED')
    const all = e && snapshots.get(e.id)
    const r = all?.find((x) => x.studentId === meStudent().id)
    if (!e || !r) return error(404, 'Result not found')
    return HttpResponse.json({
      totalObtained: r.totalObtained,
      totalMax: r.totalMax,
      percentage: r.percentage,
      grade: r.grade,
      rank: r.rank,
      isPass: r.isPass,
      examId: e.id,
      examName: e.name,
      type: e.type,
      academicYearName: current.name,
      publishedAt: e.publishedAt!,
      classSize: all!.length,
      subjects: r.subjects,
    })
  }),
]

/** Used by the dashboard mock. */
export const examStats = () => ({
  draftExamsMissingMarks: exams.filter(
    (e) =>
      e.status === 'DRAFT' && detailDto(e).subjects.some((s) => s.enteredCount < s.totalStudents)
  ).length,
  examsChangedSincePublish: exams.filter(
    (e) => e.status === 'PUBLISHED' && e.changedSinceLastPublish
  ).length,
  recentExams: [...exams]
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      name: e.name,
      className: examDto(e).classStandard,
      type: e.type,
      status: e.status,
      publishedAt: e.publishedAt,
    })),
})
