import { http, HttpResponse } from 'msw'
import type { Schemas } from '../api/client'
import { mockId } from './ids'
import { error } from './handlers'
import { photoKeys, storage, students } from './students'

// Dev-only P5 data: an activity log and the student's own photo.

type Log = Schemas['ActivityLogDto']
const ADMIN = {
  actorUserId: '00000000-0000-4000-8000-000000000001',
  actorName: 'School Admin',
  actorRole: 'ADMIN',
}
const CLERK = {
  actorUserId: '00000000-0000-4000-8000-000000000003',
  actorName: 'Office Clerk',
  actorRole: 'ADMIN',
}
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0 Safari/537.36'
const meStudent = () => students.find((s) => s.guardianEmail === 'guardian@example.com')!

let seq = 1000
const at = (daysAgo: number, hh: number, mm: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}
const log = (
  who: typeof ADMIN,
  action: string,
  entityType: string,
  createdAt: string,
  changes: Log['changes'] = null
): Log => ({
  id: String(++seq),
  ...who,
  action,
  entityType,
  entityId: mockId(),
  changes,
  ip: '103.21.12.40',
  userAgent: UA,
  createdAt,
})

const logs: Log[] = [
  log(ADMIN, 'marks.updated', 'marks', at(0, 11, 42), {
    before: { marksObtained: 22, remarks: null },
    after: { marksObtained: 24, remarks: 'Re-checked Q4' },
  }),
  log(CLERK, 'payment.recorded', 'payment', at(0, 11, 5), {
    before: {},
    after: { amount: '25000.00', method: 'UPI', receiptNo: 'RCPT-2026-001842' },
  }),
  log(ADMIN, 'invitation.sent', 'invitation', at(0, 10, 30)),
  log(ADMIN, 'student.created', 'student', at(0, 10, 24), {
    before: {},
    after: { firstName: 'Hetvik', lastName: 'Sorathiya', admissionNo: 'MAT/2026/0418' },
  }),
  log(ADMIN, 'grade_scale.updated', 'grade_scale', at(0, 9, 12), {
    before: { 'B2.minPercent': 61 },
    after: { 'B2.minPercent': 62 },
  }),
  log(CLERK, 'payment.voided', 'payment', at(1, 16, 48), {
    before: { voidedAt: null },
    after: { voidedAt: at(1, 16, 48), voidReason: 'Entered twice' },
  }),
  log(ADMIN, 'payment_submission.approved', 'payment_submission', at(1, 15, 40), {
    before: { status: 'PENDING' },
    after: { status: 'APPROVED' },
  }),
  log(ADMIN, 'marks.saved', 'marks', at(1, 15, 15)),
  log(ADMIN, 'fee.class_billed', 'fee', at(1, 11, 2), {
    before: {},
    after: { title: 'Tuition 2026-27', totalAmount: '45000.00', created: 28 },
  }),
  log(ADMIN, 'exam.published', 'exam', at(5, 11, 0), {
    before: { status: 'DRAFT' },
    after: { status: 'PUBLISHED', publishCount: 1 },
  }),
  log(ADMIN, 'payment_settings.updated', 'payment_settings', at(6, 9, 30), {
    before: { upiId: 'school@okaxis' },
    after: { upiId: 'tapovan@sbi' },
  }),
  log(ADMIN, 'student.status_changed', 'student', at(9, 14, 10), {
    before: { status: 'ACTIVE' },
    after: { status: 'INACTIVE' },
  }),
  log(ADMIN, 'class.copied', 'class', at(20, 10, 0), {
    before: {},
    after: { created: 7, skipped: 0 },
  }),
  log(ADMIN, 'academic_year.set_current', 'academic_year', at(30, 9, 0), {
    before: { isCurrent: false },
    after: { isCurrent: true },
  }),
]

export const activityHandlers = [
  http.get('/api/v1/activity-logs', ({ request }) => {
    const url = new URL(request.url)
    const f = (k: string) => url.searchParams.get(k)
    const list = logs
      .filter(
        (l) =>
          (!f('actorId') || l.actorUserId === f('actorId')) &&
          (!f('entityType') || l.entityType === f('entityType')) &&
          (!f('from') || l.createdAt >= f('from')!) &&
          (!f('to') || l.createdAt <= f('to')!)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const page = Number(f('page') ?? 1)
    const limit = Number(f('limit') ?? 50)
    return HttpResponse.json({
      items: list.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: list.length,
    })
  }),

  http.put('/api/v1/me/photo', async ({ request }) => {
    const { photoKey } = (await request.json()) as Schemas['PhotoKeyDto']
    if (!storage.has(photoKey)) return error(400, 'Upload the photo first')
    const s = meStudent()
    photoKeys.set(s.id, photoKey)
    Object.assign(s, { hasPhoto: true, updatedAt: new Date().toISOString() })
    return HttpResponse.json(s)
  }),
  http.get('/api/v1/me/photo-url', () => {
    const key = photoKeys.get(meStudent().id)
    if (!key) return error(404, 'No photo')
    return HttpResponse.json({
      url: URL.createObjectURL(storage.get(key)!),
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    })
  }),
]
