import { delay, http, HttpResponse } from 'msw'
import type { Schemas } from '../api/client'
import { error } from './handlers'

// Dev-only P1 data: academic years, classes, subjects, grade scales, /me and sessions.
// Kept in memory, so a page reload starts over.

const id = () => crypto.randomUUID()
const page = <T>(items: T[]) => ({ items, page: 1, limit: 100, total: items.length })
const noContent = () => new HttpResponse(null, { status: 204 })
const body = async <T>(r: Request) => (await r.json()) as T

export const years: Schemas['AcademicYearDto'][] = [
  { id: id(), name: '2024-25', startDate: '2024-06-10', endDate: '2025-04-30', isCurrent: false },
  { id: id(), name: '2025-26', startDate: '2025-06-09', endDate: '2026-04-30', isCurrent: false },
  { id: id(), name: '2026-27', startDate: '2026-06-08', endDate: '2027-04-30', isCurrent: true },
]

export const classes: Schemas['ClassDto'][] = years
  .slice(1)
  .flatMap((y) =>
    [4, 5, 6, 7, 8, 9, 10].map((n) => ({ id: id(), academicYearId: y.id, standard: `Std ${n}` }))
  )
// Pretend the current year's classes have students, so deleting them shows the 409 path.
const classesWithStudents = new Set(
  classes.filter((c) => c.academicYearId === years[2].id).map((c) => c.id)
)

const subjects: Schemas['SubjectDto'][] = [
  ['Gujarati', 'GUJ'],
  ['English', 'ENG'],
  ['Hindi', 'HIN'],
  ['Mathematics', 'MAT'],
  ['Science', 'SCI'],
  ['Social Science', 'SST'],
  ['Sanskrit', 'SAN'],
  ['Environment', 'EVS'],
].map(([name, code]) => ({ id: id(), name, code, isActive: true }))
subjects.push({ id: id(), name: 'Drawing', code: 'DRW', isActive: false })
const subjectsInExams = new Set(subjects.slice(0, 7).map((s) => s.id))

const band = (grade: string, minPercent: number, maxPercent: number, isPass = true) => ({
  grade,
  minPercent,
  maxPercent,
  remark: null,
  isPass,
})
const scales: Schemas['GradeScaleDto'][] = [
  {
    id: id(),
    name: 'GSEB standard',
    isDefault: true,
    bands: [
      band('A1', 91, 100),
      band('A2', 81, 90.99),
      band('B1', 71, 80.99),
      band('B2', 61, 70.99),
      band('C1', 51, 60.99),
      band('C2', 41, 50.99),
      band('D', 33, 40.99),
      band('E', 0, 32.99, false),
    ],
  },
  {
    id: id(),
    name: 'Pass / Fail only',
    isDefault: false,
    bands: [band('P', 33, 100), band('F', 0, 32.99, false)],
  },
]

const me = {
  phone: '9876543210' as string | null,
  createdAt: '2026-06-01T09:00:00.000Z',
}
let sessions: Schemas['SessionDto'][] = [
  {
    familyId: id(),
    userAgent: navigator.userAgent,
    ip: '127.0.0.1',
    lastUsedAt: new Date().toISOString(),
    current: true,
  },
  {
    familyId: id(),
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile Safari/604.1',
    ip: '103.21.12.40',
    lastUsedAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
    current: false,
  },
]

export const setupHandlers = [
  /* academic years */
  http.get('/api/v1/academic-years', () => HttpResponse.json(page(years))),
  http.post('/api/v1/academic-years', async ({ request }) => {
    await delay(300)
    const b = await body<Schemas['CreateAcademicYearDto']>(request)
    if (years.some((y) => y.name === b.name))
      return error(409, `An academic year named ${b.name} already exists`)
    const y = { id: id(), isCurrent: false, ...b }
    years.push(y)
    return HttpResponse.json(y, { status: 201 })
  }),
  http.patch('/api/v1/academic-years/:id', async ({ params, request }) => {
    const y = years.find((x) => x.id === params.id)
    if (!y) return error(404, 'Academic year not found')
    Object.assign(y, await body<Schemas['UpdateAcademicYearDto']>(request))
    return HttpResponse.json(y)
  }),
  http.post('/api/v1/academic-years/:id/set-current', ({ params }) => {
    const y = years.find((x) => x.id === params.id)
    if (!y) return error(404, 'Academic year not found')
    years.forEach((x) => (x.isCurrent = x.id === y.id))
    return HttpResponse.json(y)
  }),
  http.delete('/api/v1/academic-years/:id', ({ params }) => {
    if (classes.some((c) => c.academicYearId === params.id))
      return error(409, 'This year has classes. Delete them first.')
    years.splice(
      years.findIndex((y) => y.id === params.id),
      1
    )
    return noContent()
  }),

  /* classes */
  http.get('/api/v1/classes', ({ request }) => {
    const yearId = new URL(request.url).searchParams.get('academicYearId')
    return HttpResponse.json(page(classes.filter((c) => !yearId || c.academicYearId === yearId)))
  }),
  http.post('/api/v1/classes', async ({ request }) => {
    await delay(250)
    const { items } = await body<Schemas['CreateClassesDto']>(request)
    const dupe = items.find((i) =>
      classes.some((c) => c.academicYearId === i.academicYearId && c.standard === i.standard)
    )
    if (dupe) return error(409, `${dupe.standard} already exists in this year`)
    const created = items.map((i) => ({ id: id(), ...i }))
    classes.push(...created)
    return HttpResponse.json({ items: created }, { status: 201 })
  }),
  http.post('/api/v1/classes/copy', async ({ request }) => {
    await delay(300)
    const b = await body<Schemas['CopyClassesDto']>(request)
    let created = 0
    let skipped = 0
    for (const c of classes.filter((x) => x.academicYearId === b.fromAcademicYearId)) {
      if (classes.some((x) => x.academicYearId === b.toAcademicYearId && x.standard === c.standard))
        skipped++
      else {
        classes.push({ id: id(), academicYearId: b.toAcademicYearId, standard: c.standard })
        created++
      }
    }
    return HttpResponse.json({ created, skipped })
  }),
  http.patch('/api/v1/classes/:id', async ({ params, request }) => {
    const c = classes.find((x) => x.id === params.id)
    if (!c) return error(404, 'Class not found')
    Object.assign(c, await body<Schemas['UpdateClassDto']>(request))
    return HttpResponse.json(c)
  }),
  http.delete('/api/v1/classes/:id', ({ params }) => {
    if (classesWithStudents.has(params.id as string))
      return error(409, "This class has students enrolled and can't be deleted. Rename it instead.")
    classes.splice(
      classes.findIndex((c) => c.id === params.id),
      1
    )
    return noContent()
  }),

  /* subjects */
  http.get('/api/v1/subjects', ({ request }) => {
    const p = new URL(request.url).searchParams
    const q = (p.get('q') ?? '').toLowerCase()
    const active = p.get('isActive')
    return HttpResponse.json(
      page(
        subjects.filter(
          (s) =>
            (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) &&
            (active === null || String(s.isActive) === active)
        )
      )
    )
  }),
  http.post('/api/v1/subjects', async ({ request }) => {
    await delay(250)
    const { items } = await body<Schemas['CreateSubjectsDto']>(request)
    const dupe = items.find((i) => subjects.some((s) => s.code === i.code))
    if (dupe) return error(409, `The code ${dupe.code} is already used`)
    const created = items.map((i) => ({ id: id(), isActive: true, ...i }))
    subjects.push(...created)
    return HttpResponse.json({ items: created }, { status: 201 })
  }),
  http.patch('/api/v1/subjects/:id', async ({ params, request }) => {
    const s = subjects.find((x) => x.id === params.id)
    if (!s) return error(404, 'Subject not found')
    Object.assign(s, await body<Schemas['UpdateSubjectDto']>(request))
    return HttpResponse.json(s)
  }),
  http.delete('/api/v1/subjects/:id', ({ params }) => {
    if (subjectsInExams.has(params.id as string))
      return error(409, 'This subject is used in exams. Make it inactive instead.')
    subjects.splice(
      subjects.findIndex((s) => s.id === params.id),
      1
    )
    return noContent()
  }),

  /* grade scales */
  http.get('/api/v1/grade-scales', () => HttpResponse.json(page(scales))),
  http.post('/api/v1/grade-scales', async ({ request }) => {
    await delay(300)
    const b = await body<Schemas['CreateGradeScaleDto']>(request)
    const s = {
      id: id(),
      name: b.name,
      isDefault: !!b.isDefault,
      bands: b.bands.map((x) => ({ ...x, remark: x.remark ?? null, isPass: x.isPass ?? true })),
    }
    if (s.isDefault) scales.forEach((x) => (x.isDefault = false))
    scales.push(s)
    return HttpResponse.json(s, { status: 201 })
  }),
  http.patch('/api/v1/grade-scales/:id', async ({ params, request }) => {
    await delay(300)
    const s = scales.find((x) => x.id === params.id)
    if (!s) return error(404, 'Grade scale not found')
    const b = await body<Schemas['UpdateGradeScaleDto']>(request)
    if (b.isDefault) scales.forEach((x) => (x.isDefault = false))
    Object.assign(s, {
      ...b,
      bands:
        b.bands?.map((x) => ({ ...x, remark: x.remark ?? null, isPass: x.isPass ?? true })) ??
        s.bands,
    })
    return HttpResponse.json(s)
  }),
  http.delete('/api/v1/grade-scales/:id', ({ params }) => {
    scales.splice(
      scales.findIndex((s) => s.id === params.id),
      1
    )
    return noContent()
  }),

  /* me, password, sessions (works for whichever mock user is signed in) */
  http.get('/api/v1/me', ({ request }) => {
    const userId = request.headers.get('Authorization')?.split('.')[1]
    const isAdmin = userId?.endsWith('1')
    return HttpResponse.json({
      id: userId ?? id(),
      email: isAdmin ? 'admin@tapovan.test' : 'guardian@example.com',
      role: isAdmin ? 'ADMIN' : 'STUDENT',
      fullName: isAdmin ? 'School Admin' : 'Aarav Patel',
      phone: me.phone,
      isActive: true,
      createdAt: me.createdAt,
      updatedAt: new Date().toISOString(),
    })
  }),
  http.patch('/api/v1/me', async ({ request }) => {
    await delay(300)
    const b = await body<Schemas['UpdateMeDto']>(request)
    me.phone = b.phone ?? me.phone
    const userId = request.headers.get('Authorization')?.split('.')[1]
    const isAdmin = userId?.endsWith('1')
    return HttpResponse.json({
      id: userId ?? id(),
      email: isAdmin ? 'admin@tapovan.test' : 'guardian@example.com',
      role: isAdmin ? 'ADMIN' : 'STUDENT',
      fullName: b.fullName ?? (isAdmin ? 'School Admin' : 'Aarav Patel'),
      phone: me.phone,
      isActive: true,
      createdAt: me.createdAt,
      updatedAt: new Date().toISOString(),
    })
  }),
  http.post('/api/v1/auth/change-password', async ({ request }) => {
    await delay(400)
    const b = await body<Schemas['ChangePasswordDto']>(request)
    return b.currentPassword === 'password123'
      ? noContent()
      : error(401, 'Current password is wrong')
  }),
  http.get('/api/v1/me/sessions', () => HttpResponse.json(sessions)),
  http.post('/api/v1/me/sessions/revoke-others', async () => {
    await delay(300)
    sessions = sessions.filter((s) => s.current)
    return noContent()
  }),
]
