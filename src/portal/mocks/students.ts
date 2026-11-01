import { delay, http, HttpResponse } from 'msw'
import type { Schemas } from '../api/client'
import { error } from './handlers'
import { classes, years } from './setup'

// Dev-only P2 data: students, enrollments, documents, uploads, admins and invitations.

type Student = Schemas['StudentDto']
const id = () => crypto.randomUUID()
const now = () => new Date().toISOString()
const noContent = () => new HttpResponse(null, { status: 204 })
const body = async <T>(r: Request) => (await r.json()) as T
const userIdFrom = (r: Request) => r.headers.get('Authorization')?.split('.')[1]

const current = years.find((y) => y.isCurrent)!
const classIn = (standard: string) =>
  classes.find((c) => c.academicYearId === current.id && c.standard === standard)!
const lastYear = years.find((y) => y.name === '2025-26')!
const classLastYear = (standard: string) =>
  classes.find((c) => c.academicYearId === lastYear.id && c.standard === standard)!

let seq = 400
const seed: [string, string, Student['gender'], string, string, string][] = [
  ['Aarav', 'Patel', 'MALE', 'Std 8', 'Nilesh Patel', 'guardian@example.com'],
  ['Darshan', 'Patel', 'MALE', 'Std 8', 'Hitesh Patel', 'hitesh.p@example.com'],
  ['Harsh', 'Patel', 'MALE', 'Std 8', 'Ramesh Patel', 'ramesh.p@example.com'],
  ['Jainil', 'Patel', 'MALE', 'Std 8', 'Kirit Patel', 'kirit.p@example.com'],
  ['Kavya', 'Shah', 'FEMALE', 'Std 8', 'Mahesh Shah', 'mahesh.s@example.com'],
  ['Mihir', 'Patel', 'MALE', 'Std 8', 'Suresh Patel', 'suresh.p@example.com'],
  ['Dhruv', 'Thummar', 'MALE', 'Std 9', 'Bharat Thummar', 'bharat.t@example.com'],
  ['Riya', 'Vekariya', 'FEMALE', 'Std 9', 'Jayesh Vekariya', 'jayesh.v@example.com'],
  ['Om', 'Kathiriya', 'MALE', 'Std 10', 'Paresh Kathiriya', 'paresh.k@example.com'],
  ['Rudra', 'Sojitra', 'MALE', 'Std 10', 'Vipul Sojitra', 'vipul.s@example.com'],
  ['Hetvik', 'Sorathiya', 'MALE', 'Std 5', 'Pravin Sorathiya', 'pravin.s@example.com'],
  ['Nisha', 'Gajera', 'FEMALE', 'Std 7', 'Ashok Gajera', 'ashok.g@example.com'],
]

const students: Student[] = []
const enrollments: Schemas['EnrollmentDto'][] = []

seed.forEach(([firstName, lastName, gender, std, guardianName, guardianEmail], i) => {
  const s: Student = {
    id: id(),
    admissionNo: `MAT/2023/${String(++seq).padStart(4, '0')}`,
    firstName,
    lastName,
    dob: `201${1 + (i % 5)}-0${1 + (i % 9)}-1${i % 9}`,
    gender,
    admissionDate: '2023-06-12',
    status: 'ACTIVE',
    bloodGroup: (['B+', 'O+', 'A+', null] as const)[i % 4],
    aadhaarNo: i % 3 ? `55218830${String(1000 + i)}` : null,
    motherTongue: 'Gujarati',
    previousSchool: null,
    addressLine: `${10 + i}, Shanti Nagar Society, Gondal Road`,
    city: 'Rajkot',
    state: 'Gujarat',
    pincode: '360004',
    guardianName,
    guardianPhone: `98250${String(41206 + i * 7).slice(-5)}`,
    guardianRelation: 'Father',
    guardianEmail,
    hasPhoto: false,
    createdAt: '2023-06-12T09:00:00.000Z',
    updatedAt: '2023-06-12T09:00:00.000Z',
  }
  students.push(s)
  const roll =
    students.filter((x) =>
      enrollments.some((e) => e.studentId === x.id && e.classId === classIn(std).id)
    ).length + 1
  enrollments.push({
    id: id(),
    studentId: s.id,
    academicYearId: current.id,
    classId: classIn(std).id,
    rollNo: roll,
    boarding: i % 3 ? 'DAY_SCHOLAR' : 'HOSTEL',
    createdAt: '2026-06-08T09:00:00.000Z',
    updatedAt: '2026-06-08T09:00:00.000Z',
  })
  const prev = `Std ${Number(std.split(' ')[1]) - 1}`
  // Last year's Std 9 is kept for the promotion demo below.
  if (classLastYear(prev) && prev !== 'Std 9')
    enrollments.push({
      id: id(),
      studentId: s.id,
      academicYearId: lastYear.id,
      classId: classLastYear(prev).id,
      rollNo: roll,
      boarding: 'DAY_SCHOLAR',
      createdAt: '2025-06-09T09:00:00.000Z',
      updatedAt: '2025-06-09T09:00:00.000Z',
    })
})
// In 2025-26 Std 9 and not enrolled yet this year: try Promote → 2025-26 Std 9 → 2026-27 Std 10.
;[
  ['Tirth', 'Akbari'],
  ['Smit', 'Dobariya'],
  ['Vivek', 'Bhalala'],
].forEach(([firstName, lastName], i) => {
  const s = {
    ...students[i + 6],
    id: id(),
    firstName,
    lastName,
    admissionNo: `MAT/2022/0${210 + i}`,
    guardianEmail: `${firstName.toLowerCase()}.${lastName[0].toLowerCase()}@example.com`,
    guardianName: `${lastName} family`,
  }
  students.push(s)
  enrollments.push({
    id: id(),
    studentId: s.id,
    academicYearId: lastYear.id,
    classId: classLastYear('Std 9').id,
    rollNo: i + 1,
    boarding: 'HOSTEL',
    createdAt: '2025-06-09T09:00:00.000Z',
    updatedAt: '2025-06-09T09:00:00.000Z',
  })
})
students.push({
  ...students[0],
  id: id(),
  firstName: 'Yash',
  lastName: 'Ramani',
  admissionNo: 'MAT/2019/0112',
  status: 'ALUMNI',
  guardianEmail: 'yash.r@example.com',
  guardianName: 'Kishor Ramani',
})
students.push({
  ...students[1],
  id: id(),
  firstName: 'Meet',
  lastName: 'Gajera',
  admissionNo: 'MAT/2022/0301',
  status: 'INACTIVE',
  guardianEmail: 'meet.g@example.com',
  guardianName: 'Dinesh Gajera',
})

const documents: Schemas['StudentDocumentDto'][] = [
  {
    id: id(),
    studentId: students[0].id,
    type: 'STUDENT_AADHAAR',
    title: 'Aadhaar card',
    mimeType: 'application/pdf',
    sizeBytes: 640_000,
    uploadedBy: id(),
    createdAt: '2023-06-14T10:00:00.000Z',
  },
  {
    id: id(),
    studentId: students[0].id,
    type: 'SCHOOL_LEAVING_CERTIFICATE',
    title: 'Leaving certificate (previous school)',
    mimeType: 'application/pdf',
    sizeBytes: 280_000,
    uploadedBy: id(),
    createdAt: '2023-06-12T10:00:00.000Z',
  },
  {
    id: id(),
    studentId: students[0].id,
    type: 'LAST_YEAR_MARKSHEET',
    title: 'Std 7 marksheet',
    mimeType: 'image/jpeg',
    sizeBytes: 1_100_000,
    uploadedBy: id(),
    createdAt: '2026-04-18T10:00:00.000Z',
  },
]

// Stand-in for object storage: presigned PUTs land here, signed GETs become blob URLs.
const storage = new Map<string, Blob>()
const photoKeys = new Map<string, string>()
const docKeys = new Map<string, string>()

const admins: Schemas['UserDto'][] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'admin@tapovan.test',
    role: 'ADMIN',
    fullName: 'School Admin',
    phone: '9876543210',
    isActive: true,
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: now(),
  },
  {
    id: id(),
    email: 'clerk@tapovan.test',
    role: 'ADMIN',
    fullName: 'Office Clerk',
    phone: '9825011122',
    isActive: true,
    createdAt: '2026-06-05T09:00:00.000Z',
    updatedAt: now(),
  },
  {
    id: id(),
    email: 'office.old@tapovan.test',
    role: 'ADMIN',
    fullName: 'Old office account',
    phone: null as unknown as string,
    isActive: false,
    createdAt: '2025-01-10T09:00:00.000Z',
    updatedAt: now(),
  },
]

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString()
const invitations: Schemas['InvitationDto'][] = [
  {
    id: id(),
    email: students[10].guardianEmail,
    role: 'STUDENT',
    fullName: 'Hetvik Sorathiya',
    studentId: students[10].id,
    status: 'PENDING',
    expiresAt: hoursFromNow(70),
    createdAt: hoursFromNow(-2),
  },
  {
    id: id(),
    email: students[5].guardianEmail,
    role: 'STUDENT',
    fullName: 'Mihir Patel',
    studentId: students[5].id,
    status: 'PENDING',
    expiresAt: hoursFromNow(30),
    createdAt: hoursFromNow(-42),
  },
  {
    id: id(),
    email: 'clerk2@tapovan.test',
    role: 'ADMIN',
    fullName: 'Office Clerk 2',
    studentId: null,
    status: 'PENDING',
    expiresAt: hoursFromNow(8),
    createdAt: hoursFromNow(-64),
  },
  {
    id: id(),
    email: students[3].guardianEmail,
    role: 'STUDENT',
    fullName: 'Jainil Patel',
    studentId: students[3].id,
    status: 'EXPIRED',
    expiresAt: hoursFromNow(-200),
    createdAt: hoursFromNow(-272),
  },
  {
    id: id(),
    email: students[2].guardianEmail,
    role: 'STUDENT',
    fullName: 'Harsh Patel',
    studentId: students[2].id,
    status: 'ACCEPTED',
    expiresAt: hoursFromNow(-50),
    createdAt: hoursFromNow(-100),
  },
  {
    id: id(),
    email: 'office.old@tapovan.test',
    role: 'ADMIN',
    fullName: 'Old office account',
    studentId: null,
    status: 'REVOKED',
    expiresAt: hoursFromNow(-1500),
    createdAt: hoursFromNow(-1572),
  },
]

const invite = (
  email: string,
  role: 'ADMIN' | 'STUDENT',
  fullName: string,
  studentId: string | null
) => {
  // A new invite replaces any pending one for the same email.
  invitations.forEach((i) => i.email === email && i.status === 'PENDING' && (i.status = 'REVOKED'))
  const inv: Schemas['InvitationDto'] = {
    id: id(),
    email,
    role,
    fullName,
    studentId,
    status: 'PENDING',
    expiresAt: hoursFromNow(72),
    createdAt: now(),
  }
  invitations.unshift(inv)
  return inv
}

export const studentHandlers = [
  /* students */
  http.get('/api/v1/students', async ({ request }) => {
    await delay(250)
    const p = new URL(request.url).searchParams
    const q = (p.get('q') ?? '').toLowerCase()
    const classId = p.get('classId')
    const status = p.get('status')
    const sort = (p.get('sort') ?? 'name') as 'name' | 'admissionNo' | 'createdAt'
    const dir = p.get('order') === 'desc' ? -1 : 1
    const page = Number(p.get('page') ?? 1)
    const limit = Number(p.get('limit') ?? 25)
    const list = students
      .filter(
        (s) =>
          (!q || `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(q)) &&
          (!status || s.status === status) &&
          (!classId || enrollments.some((e) => e.studentId === s.id && e.classId === classId))
      )
      .sort((a, b) => {
        const key = (s: Student) => (sort === 'name' ? `${s.firstName} ${s.lastName}` : s[sort])
        return key(a).localeCompare(key(b)) * dir
      })
    return HttpResponse.json({
      items: list.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: list.length,
    })
  }),
  http.post('/api/v1/students', async ({ request }) => {
    await delay(400)
    const { items } = await body<Schemas['CreateStudentsDto']>(request)
    const bad = items.findIndex((i) =>
      students.some(
        (s) =>
          s.guardianEmail === i.guardianEmail &&
          s.status === 'ACTIVE' &&
          i.guardianEmail === 'guardian@example.com'
      )
    )
    if (bad >= 0)
      return error(400, [`items.${bad}.guardianEmail is already used by another student`])
    const created = items.map(({ enrollment, sendInvite, ...rest }) => {
      const s: Student = {
        bloodGroup: null,
        aadhaarNo: null,
        motherTongue: null,
        previousSchool: null,
        addressLine: null,
        city: null,
        state: null,
        pincode: null,
        ...rest,
        id: id(),
        admissionNo: `MAT/2026/${String(++seq).padStart(4, '0')}`,
        status: 'ACTIVE',
        hasPhoto: false,
        createdAt: now(),
        updatedAt: now(),
      }
      students.push(s)
      if (enrollment)
        enrollments.push({
          id: id(),
          studentId: s.id,
          rollNo: enrollment.rollNo ?? null,
          ...enrollment,
          createdAt: now(),
          updatedAt: now(),
        })
      if (sendInvite) invite(s.guardianEmail, 'STUDENT', `${s.firstName} ${s.lastName}`, s.id)
      return s
    })
    return HttpResponse.json({ items: created }, { status: 201 })
  }),
  http.get('/api/v1/students/:id', ({ params }) => {
    const s = students.find((x) => x.id === params.id)
    return s ? HttpResponse.json(s) : error(404, 'Student not found')
  }),
  http.patch('/api/v1/students/:id', async ({ params, request }) => {
    await delay(300)
    const s = students.find((x) => x.id === params.id)
    if (!s) return error(404, 'Student not found')
    Object.assign(s, await body<Schemas['UpdateStudentDto']>(request), { updatedAt: now() })
    return HttpResponse.json(s)
  }),
  http.patch('/api/v1/students/:id/status', async ({ params, request }) => {
    const s = students.find((x) => x.id === params.id)
    if (!s) return error(404, 'Student not found')
    Object.assign(s, await body<Schemas['UpdateStudentStatusDto']>(request), { updatedAt: now() })
    return HttpResponse.json(s)
  }),
  http.delete('/api/v1/students/:id', ({ params }) => {
    students.splice(
      students.findIndex((s) => s.id === params.id),
      1
    )
    return noContent()
  }),

  /* uploads */
  http.post('/api/v1/uploads/presign', async ({ request }) => {
    const b = await body<Schemas['PresignUploadDto']>(request)
    const key = `${b.purpose.toLowerCase()}/${id()}`
    return HttpResponse.json(
      {
        uploadUrl: `/mock-storage/${key}`,
        key,
        expiresAt: hoursFromNow(0.25),
        headers: { 'Content-Type': b.contentType },
      },
      { status: 201 }
    )
  }),
  http.put('/mock-storage/*', async ({ request }) => {
    await delay(600)
    storage.set(new URL(request.url).pathname.replace('/mock-storage/', ''), await request.blob())
    return new HttpResponse(null, { status: 200 })
  }),
  http.put('/api/v1/students/:id/photo', async ({ params, request }) => {
    const s = students.find((x) => x.id === params.id)
    if (!s) return error(404, 'Student not found')
    const { photoKey } = await body<Schemas['PhotoKeyDto']>(request)
    if (!storage.has(photoKey)) return error(400, 'Upload the photo first')
    photoKeys.set(s.id, photoKey)
    Object.assign(s, { hasPhoto: true, updatedAt: now() })
    return HttpResponse.json(s)
  }),
  http.get('/api/v1/students/:id/photo-url', ({ params }) => {
    const key = photoKeys.get(params.id as string)
    if (!key) return error(404, 'No photo')
    return HttpResponse.json({
      url: URL.createObjectURL(storage.get(key)!),
      expiresAt: hoursFromNow(0.1),
    })
  }),

  /* enrollments */
  http.get('/api/v1/students/:id/enrollments', ({ params }) =>
    HttpResponse.json(enrollments.filter((e) => e.studentId === params.id))
  ),
  http.post('/api/v1/enrollments', async ({ request }) => {
    await delay(300)
    const { items } = await body<Schemas['CreateEnrollmentsDto']>(request)
    if (
      items.some((i) =>
        enrollments.some(
          (e) => e.studentId === i.studentId && e.academicYearId === i.academicYearId
        )
      )
    )
      return error(409, 'This student is already enrolled in that year')
    const created = items.map((i) => ({
      id: id(),
      rollNo: i.rollNo ?? null,
      ...i,
      createdAt: now(),
      updatedAt: now(),
    }))
    enrollments.push(...created)
    return HttpResponse.json({ items: created }, { status: 201 })
  }),
  http.patch('/api/v1/enrollments/:id', async ({ params, request }) => {
    const e = enrollments.find((x) => x.id === params.id)
    if (!e) return error(404, 'Enrollment not found')
    Object.assign(e, await body<Schemas['UpdateEnrollmentDto']>(request), { updatedAt: now() })
    return HttpResponse.json(e)
  }),
  http.post('/api/v1/enrollments/promote', async ({ request }) => {
    await delay(500)
    const b = await body<Schemas['PromoteStudentsDto']>(request)
    const to = classes.find((c) => c.id === b.toClassId)
    if (!to) return error(404, 'Class not found')
    const already = b.studentIds.find((sid) =>
      enrollments.some((e) => e.studentId === sid && e.academicYearId === to.academicYearId)
    )
    if (already) return error(400, ['A selected student is already enrolled in that year'])
    const names = (sid: string) => students.find((s) => s.id === sid)!
    const order =
      b.rollNumbers === 'ALPHABETICAL'
        ? [...b.studentIds].sort((x, y) =>
            `${names(x).firstName} ${names(x).lastName}`.localeCompare(
              `${names(y).firstName} ${names(y).lastName}`
            )
          )
        : b.studentIds
    const created = order.map((studentId, i) => ({
      id: id(),
      studentId,
      academicYearId: to.academicYearId,
      classId: to.id,
      rollNo: i + 1,
      boarding:
        enrollments.find((e) => e.studentId === studentId && e.classId === b.fromClassId)
          ?.boarding ?? ('DAY_SCHOLAR' as const),
      createdAt: now(),
      updatedAt: now(),
    }))
    enrollments.push(...created)
    return HttpResponse.json({ items: created }, { status: 201 })
  }),

  /* documents */
  http.get('/api/v1/students/:id/documents', ({ params }) =>
    HttpResponse.json(documents.filter((d) => d.studentId === params.id))
  ),
  http.post('/api/v1/students/:id/documents', async ({ params, request }) => {
    const b = await body<Schemas['CreateStudentDocumentDto']>(request)
    if (!storage.has(b.key)) return error(400, 'Upload the file first')
    const d = {
      id: id(),
      studentId: params.id as string,
      type: b.type,
      title: b.title,
      mimeType: b.mimeType,
      sizeBytes: b.sizeBytes,
      uploadedBy: id(),
      createdAt: now(),
    }
    docKeys.set(d.id, b.key)
    documents.push(d)
    return HttpResponse.json(d, { status: 201 })
  }),
  http.get('/api/v1/documents/:id/url', ({ params }) => {
    const key = docKeys.get(params.id as string)
    // Seeded documents have no file behind them; hand back a tiny placeholder.
    const blob = key
      ? storage.get(key)!
      : new Blob(['Sample document from the mock API'], { type: 'text/plain' })
    return HttpResponse.json({ url: URL.createObjectURL(blob), expiresAt: hoursFromNow(0.1) })
  }),
  http.delete('/api/v1/documents/:id', ({ params }) => {
    documents.splice(
      documents.findIndex((d) => d.id === params.id),
      1
    )
    return noContent()
  }),

  /* admins */
  http.get('/api/v1/admins', ({ request }) => {
    const active = new URL(request.url).searchParams.get('isActive')
    const list = admins.filter((a) => active === null || String(a.isActive) === active)
    return HttpResponse.json({ items: list, page: 1, limit: 100, total: list.length })
  }),
  http.post('/api/v1/admins', async ({ request }) => {
    await delay(400)
    const b = await body<Schemas['CreateAdminDto']>(request)
    if (admins.some((a) => a.email === b.email.toLowerCase()))
      return error(409, `${b.email} already has an admin account`)
    return HttpResponse.json(invite(b.email.toLowerCase(), 'ADMIN', b.fullName, null), {
      status: 201,
    })
  }),
  http.patch('/api/v1/admins/:id', async ({ params, request }) => {
    const a = admins.find((x) => x.id === params.id)
    if (!a) return error(404, 'Admin not found')
    Object.assign(a, await body<Schemas['UpdateAdminDto']>(request), { updatedAt: now() })
    return HttpResponse.json(a)
  }),
  http.patch('/api/v1/admins/:id/status', async ({ params, request }) => {
    if (userIdFrom(request) === params.id)
      return error(409, "You can't deactivate your own account")
    const a = admins.find((x) => x.id === params.id)
    if (!a) return error(404, 'Admin not found')
    Object.assign(a, await body<Schemas['UpdateAdminStatusDto']>(request), { updatedAt: now() })
    return HttpResponse.json(a)
  }),

  /* invitations */
  http.get('/api/v1/invitations', ({ request }) => {
    const p = new URL(request.url).searchParams
    const list = invitations.filter(
      (i) =>
        (!p.get('status') || i.status === p.get('status')) &&
        (!p.get('role') || i.role === p.get('role'))
    )
    return HttpResponse.json({ items: list, page: 1, limit: 100, total: list.length })
  }),
  http.post('/api/v1/invitations', async ({ request }) => {
    await delay(400)
    const { items } = await body<Schemas['CreateInvitationsDto']>(request)
    const missing = items.findIndex((i) => !students.some((s) => s.id === i.studentId))
    if (missing >= 0) return error(404, `items.${missing}.studentId not found`)
    const created = items.map((i) => {
      const s = students.find((x) => x.id === i.studentId)!
      return invite(s.guardianEmail, 'STUDENT', `${s.firstName} ${s.lastName}`, s.id)
    })
    return HttpResponse.json({ items: created }, { status: 201 })
  }),
  http.delete('/api/v1/invitations/:id', ({ params }) => {
    const i = invitations.find((x) => x.id === params.id)
    if (!i) return error(404, 'Invitation not found')
    i.status = 'REVOKED'
    return noContent()
  }),
]
