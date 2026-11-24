import { delay, http, HttpResponse } from 'msw'
import type { Schemas } from '../api/client'
import { examStats } from './exams'
import { error } from './handlers'
import { classes, years } from './setup'
import { enrollments, invitations, storage, students } from './students'

// Dev-only P3 data: fees, payments, payment requests and the school's payment details.
// Money is kept as numbers here and sent as "45000.00" strings, like the real API.

type FeeType = Schemas['StudentFeeDto']['feeType']
type Method = Schemas['FeePaymentDto']['method']
type Fee = {
  id: string
  studentId: string
  academicYearId: string
  feeType: FeeType
  title: string
  total: number
  dueDate: string | null
  notes: string | null
  createdAt: string
}
type Payment = Omit<Schemas['FeePaymentDto'], 'amount'> & { amount: number }
type Submission = Omit<
  Schemas['PaymentSubmissionDto'],
  'amount' | 'utrSeenBefore' | 'studentName'
> & {
  amount: number
  screenshotKey: string
}

import { mockId as id } from './ids'
const without = <T extends object, K extends keyof T>(o: T, ...keys: K[]) => {
  const copy = { ...o }
  keys.forEach((k) => delete copy[k])
  return copy as Omit<T, K>
}
const now = () => new Date().toISOString()
const money = (n: number) => n.toFixed(2)
const body = async <T>(r: Request) => (await r.json()) as T
const TODAY = new Date().toISOString().slice(0, 10)
const current = years.find((y) => y.isCurrent)!
const ADMIN_ID = '00000000-0000-4000-8000-000000000001'
const isStudentCaller = (r: Request) => r.headers.get('Authorization')?.split('.')[1]?.endsWith('2')
const meStudent = () => students.find((s) => s.guardianEmail === 'guardian@example.com')!
const nameOf = (studentId: string) => {
  const s = students.find((x) => x.id === studentId)
  return s ? `${s.firstName} ${s.lastName}` : 'Unknown student'
}

const fees: Fee[] = []
const payments: Payment[] = []
const submissions: Submission[] = []
let receiptSeq = 400
const nextReceipt = () => `RCPT-2026-${String(++receiptSeq).padStart(6, '0')}`

const addFee = (
  studentId: string,
  feeType: FeeType,
  title: string,
  total: number,
  dueDate: string | null
) => {
  const f: Fee = {
    id: id(),
    studentId,
    academicYearId: current.id,
    feeType,
    title,
    total,
    dueDate,
    notes: null,
    createdAt: '2026-06-08T09:00:00.000Z',
  }
  fees.push(f)
  return f
}
const addPayment = (
  fee: Fee,
  amount: number,
  method: Method,
  paidOn: string,
  referenceNo: string | null = null
) => {
  const p: Payment = {
    id: id(),
    studentFeeId: fee.id,
    amount,
    paidOn,
    method,
    referenceNo,
    receiptNo: nextReceipt(),
    notes: null,
    recordedBy: ADMIN_ID,
    voidedAt: null,
    voidReason: null,
    createdAt: `${paidOn}T10:00:00.000Z`,
  }
  payments.push(p)
  return p
}

// Seed: every student enrolled this year gets tuition; hostel students also get hostel.
// Some are paid, some part paid, and a few are overdue (due 15 Oct).
enrollments
  .filter((e) => e.academicYearId === current.id)
  .forEach((e, i) => {
    const overdue = i % 4 === 1
    const t = addFee(
      e.studentId,
      'TUITION',
      `Tuition ${current.name}`,
      45000,
      overdue ? '2026-10-15' : '2026-11-30'
    )
    if (i % 4 === 0) addPayment(t, 20000, 'UPI', '2026-06-12', '623188401172')
    if (i % 4 === 0) addPayment(t, 13000, 'CASH', '2026-08-18')
    if (i % 4 === 2) addPayment(t, 45000, 'BANK_TRANSFER', '2026-06-20', 'HDFC00098123')
    if (e.boarding === 'HOSTEL') {
      const h = addFee(e.studentId, 'HOSTEL', `Hostel ${current.name}`, 60000, '2026-11-30')
      if (i % 2 === 0) addPayment(h, 60000, 'CHEQUE', '2026-06-10', '004512')
      else addPayment(h, 30000, 'UPI', '2026-07-02', '611200984471')
    }
  })
// A voided payment, for the fee item view.
const aarav = meStudent()
const aaravTuition = fees.find((f) => f.studentId === aarav.id && f.feeType === 'TUITION')!
const bounced = addPayment(aaravTuition, 5000, 'CHEQUE', '2026-08-02', '004518')
Object.assign(bounced, { voidedAt: '2026-08-09T10:00:00.000Z', voidReason: 'Cheque bounced' })
addFee(aarav.id, 'STATIONERY', `Stationery ${current.name}`, 1500, '2026-12-15')

// A fake "phone screenshot" so the review page has something to show.
const screenshot = (utr: string, amount: number) =>
  new Blob(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640"><rect width="360" height="640" fill="#f8fafc"/><rect y="0" width="360" height="160" fill="#16a34a"/><text x="180" y="90" font-family="sans-serif" font-size="22" fill="#fff" text-anchor="middle">Payment successful</text><text x="180" y="240" font-family="sans-serif" font-size="40" font-weight="700" fill="#0f172a" text-anchor="middle">₹${amount.toLocaleString('en-IN')}</text><text x="180" y="300" font-family="sans-serif" font-size="16" fill="#64748b" text-anchor="middle">To: Maharshi Atri Tapovan</text><text x="180" y="360" font-family="monospace" font-size="16" fill="#0f172a" text-anchor="middle">UTR ${utr}</text><text x="180" y="420" font-family="sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">Sample screenshot (mock data)</text></svg>`,
    ],
    { type: 'image/svg+xml' }
  )
const addSubmission = (
  fee: Fee,
  amount: number,
  method: Submission['method'],
  utr: string,
  paidOn: string,
  hoursAgo: number,
  extra: Partial<Submission> = {}
) => {
  const key = `payment_screenshot/${id()}`
  storage.set(key, screenshot(utr, amount))
  const s: Submission = {
    id: id(),
    studentFeeId: fee.id,
    feeTitle: fee.title,
    feeType: fee.feeType,
    amount,
    method,
    referenceNo: utr,
    paidOn,
    note: null,
    status: 'PENDING',
    declineReason: null,
    reviewedAt: null,
    feePaymentId: null,
    createdAt: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
    studentId: fee.studentId,
    screenshotKey: key,
    ...extra,
  }
  submissions.push(s)
  return s
}
{
  const unpaid = fees.filter(
    (f) => f.feeType === 'TUITION' && f.studentId !== aarav.id && paidOf(f) < f.total
  )
  if (unpaid[0])
    addSubmission(unpaid[0], 12000, 'UPI', '630411297781', '2026-10-31', 5, {
      note: "Paid from father's account",
    })
  if (unpaid[1]) addSubmission(unpaid[1], 45000, 'BANK_TRANSFER', 'SBIN26103198', '2026-10-29', 60)
  // Same UTR as an existing payment, to show the duplicate warning.
  if (unpaid[2]) addSubmission(unpaid[2], 20000, 'UPI', '623188401172', '2026-10-30', 20)
  addSubmission(aaravTuition, 5000, 'UPI', '598812004417', '2026-10-20', 300, {
    status: 'DECLINED',
    declineReason: 'UTR not found in the bank statement',
    reviewedAt: '2026-10-22T11:00:00.000Z',
  })
}

let settings = {
  upiId: 'tapovan@sbi' as string | null,
  payeeName: 'Maharshi Atri Tapovan' as string | null,
  qrKey: null as string | null,
  bankAccountName: 'Maharshi Atri Tapovan Trust' as string | null,
  bankAccountNo: '30215566778' as string | null,
  ifsc: 'SBIN0001234' as string | null,
  bankBranch: 'State Bank of India, Gandhinagar' as string | null,
  instructions:
    "Write the student's admission number in the payment note. After paying, send the screenshot with the UTR number here." as
      string | null,
}

function paidOf(f: Fee) {
  return payments
    .filter((p) => p.studentFeeId === f.id && !p.voidedAt)
    .reduce((a, p) => a + p.amount, 0)
}
function feeDto(f: Fee): Schemas['AdminStudentFeeDto'] {
  const paid = paidOf(f)
  const remaining = Math.max(0, f.total - paid)
  return {
    id: f.id,
    studentId: f.studentId,
    academicYearId: f.academicYearId,
    feeType: f.feeType,
    title: f.title,
    totalAmount: money(f.total),
    paidAmount: money(paid),
    remainingAmount: money(remaining),
    status: remaining === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING',
    isOverdue: remaining > 0 && !!f.dueDate && f.dueDate < TODAY,
    dueDate: f.dueDate,
    notes: f.notes,
    createdAt: f.createdAt,
    updatedAt: f.createdAt,
    payments: payments
      .filter((p) => p.studentFeeId === f.id)
      .map((p) => ({
        id: p.id,
        paidOn: p.paidOn,
        amount: money(p.amount),
        method: p.method,
        receiptNo: p.receiptNo,
        voidedAt: p.voidedAt,
        voidReason: p.voidReason,
      })),
  }
}
const paymentDto = (p: Payment): Schemas['FeePaymentDto'] => ({ ...p, amount: money(p.amount) })
function summary(list: Fee[]) {
  const dtos = list.map(feeDto)
  const sum = (k: 'totalAmount' | 'paidAmount' | 'remainingAmount', l = dtos) =>
    money(l.reduce((a, f) => a + Number(f[k]), 0))
  const types = [...new Set(dtos.map((f) => f.feeType))]
  return {
    totalAmount: sum('totalAmount'),
    paidAmount: sum('paidAmount'),
    remainingAmount: sum('remainingAmount'),
    byType: types.map((feeType) => {
      const l = dtos.filter((f) => f.feeType === feeType)
      return {
        feeType,
        totalAmount: sum('totalAmount', l),
        paidAmount: sum('paidAmount', l),
        remainingAmount: sum('remainingAmount', l),
      }
    }),
    items: dtos,
  }
}
const submissionDto = (s: Submission): Schemas['PaymentSubmissionDto'] => {
  return {
    ...without(s, 'screenshotKey'),
    amount: money(s.amount),
    studentName: nameOf(s.studentId),
    utrSeenBefore:
      payments.some(
        (p) => p.referenceNo === s.referenceNo && !p.voidedAt && p.id !== s.feePaymentId
      ) ||
      submissions.some(
        (o) => o.id !== s.id && o.referenceNo === s.referenceNo && o.status !== 'DECLINED'
      ),
  }
}
const classOf = (studentId: string, yearId = current.id) =>
  enrollments.find((e) => e.studentId === studentId && e.academicYearId === yearId)?.classId
const page = <T>(items: T[], url: URL) => {
  const p = Number(url.searchParams.get('page') ?? 1)
  const limit = Number(url.searchParams.get('limit') ?? 25)
  return { items: items.slice((p - 1) * limit, p * limit), page: p, limit, total: items.length }
}
function createPayment(item: Schemas['CreatePaymentItemDto']) {
  const fee = fees.find((f) => f.id === item.studentFeeId)
  if (!fee) return { err: error(404, 'Fee not found') }
  if (Number(item.amount) > fee.total - paidOf(fee))
    return { err: error(409, 'Amount is more than the remaining balance') }
  const p = addPayment(fee, Number(item.amount), item.method, item.paidOn, item.referenceNo ?? null)
  p.notes = item.notes ?? null
  p.createdAt = now()
  return { p }
}

export const feeHandlers = [
  /* The signed-in student's own /me includes their student record (setup.ts answers for admins). */
  http.get('/api/v1/me', ({ request }) => {
    if (!isStudentCaller(request)) return
    const s = meStudent()
    return HttpResponse.json({
      id: '00000000-0000-4000-8000-000000000002',
      email: s.guardianEmail,
      role: 'STUDENT',
      fullName: `${s.firstName} ${s.lastName}`,
      phone: s.guardianPhone,
      isActive: true,
      createdAt: '2026-06-01T09:00:00.000Z',
      updatedAt: now(),
      student: s,
    })
  }),

  /* admin: fees */
  http.get('/api/v1/fees', ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    const yearId = url.searchParams.get('academicYearId')
    const classId = url.searchParams.get('classId')
    const feeType = url.searchParams.get('feeType')
    const status = url.searchParams.get('status')
    const overdue = url.searchParams.get('overdue') === 'true'
    const list = fees
      .filter((f) => !yearId || f.academicYearId === yearId)
      .filter((f) => !classId || classOf(f.studentId, f.academicYearId) === classId)
      .filter((f) => !feeType || f.feeType === feeType)
      .map(feeDto)
      .filter((f) => !status || f.status === status)
      .filter((f) => !overdue || f.isOverdue)
      .filter((f) => {
        if (!q) return true
        const s = students.find((x) => x.id === f.studentId)
        return `${s?.firstName} ${s?.lastName} ${s?.admissionNo} ${f.title}`
          .toLowerCase()
          .includes(q)
      })
      .sort(
        (a, b) =>
          Number(b.isOverdue) - Number(a.isOverdue) ||
          (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
      )
    return HttpResponse.json(page(list, url))
  }),
  http.post('/api/v1/fees', async ({ request }) => {
    await delay(300)
    const b = await body<Schemas['CreateFeesDto']>(request)
    const created = b.items.map((it) => {
      const f = addFee(
        it.studentId,
        it.feeType,
        it.title,
        Number(it.totalAmount),
        it.dueDate ?? null
      )
      f.academicYearId = it.academicYearId
      f.notes = it.notes ?? null
      f.createdAt = now()
      return feeDto(f)
    })
    return HttpResponse.json({ items: created }, { status: 201 })
  }),
  http.patch('/api/v1/fees/:id', async ({ params, request }) => {
    const f = fees.find((x) => x.id === params.id)
    if (!f) return error(404, 'Fee not found')
    const b = await body<Schemas['UpdateFeeDto']>(request)
    if (b.totalAmount && Number(b.totalAmount) < paidOf(f))
      return error(409, 'Total is less than the amount already paid')
    Object.assign(f, {
      title: b.title ?? f.title,
      feeType: b.feeType ?? f.feeType,
      total: b.totalAmount ? Number(b.totalAmount) : f.total,
      dueDate: b.dueDate ?? f.dueDate,
      notes: b.notes ?? f.notes,
    })
    return HttpResponse.json(feeDto(f))
  }),
  http.delete('/api/v1/fees/:id', ({ params }) => {
    const i = fees.findIndex((x) => x.id === params.id)
    if (i < 0) return error(404, 'Fee not found')
    if (payments.some((p) => p.studentFeeId === params.id && !p.voidedAt))
      return error(409, 'This fee has payments. Void them first.')
    fees.splice(i, 1)
    return new HttpResponse(null, { status: 204 })
  }),
  http.get('/api/v1/students/:id/fees', ({ params }) =>
    HttpResponse.json(summary(fees.filter((f) => f.studentId === params.id)))
  ),
  http.get('/api/v1/fees/:id/payments', ({ params }) =>
    HttpResponse.json(payments.filter((p) => p.studentFeeId === params.id).map(paymentDto))
  ),
  http.post('/api/v1/classes/:id/fees', async ({ params, request }) => {
    await delay(400)
    const b = await body<Schemas['CreateClassFeeDto']>(request)
    const klass = classes.find((c) => c.id === params.id)
    if (!klass) return error(404, 'Class not found')
    let created = 0
    let skipped = 0
    enrollments
      .filter((e) => e.classId === klass.id && (!b.boarding || e.boarding === b.boarding))
      .forEach((e) => {
        if (
          fees.some(
            (f) =>
              f.studentId === e.studentId &&
              f.academicYearId === klass.academicYearId &&
              f.title === b.title
          )
        )
          return skipped++
        const f = addFee(e.studentId, b.feeType, b.title, Number(b.totalAmount), b.dueDate ?? null)
        f.academicYearId = klass.academicYearId
        f.notes = b.notes ?? null
        f.createdAt = now()
        created++
      })
    return HttpResponse.json({ created, skipped }, { status: 201 })
  }),
  http.post('/api/v1/students/:id/cash-payments', async ({ params, request }) => {
    await delay(300)
    const b = await body<Schemas['CreateCashPaymentDto']>(request)
    const f = addFee(String(params.id), b.feeType, b.title, Number(b.amount), null)
    f.academicYearId = b.academicYearId
    f.notes = b.notes ?? null
    f.createdAt = now()
    const p = addPayment(f, Number(b.amount), 'CASH', b.paidOn)
    return HttpResponse.json({ fee: feeDto(f), payment: paymentDto(p) }, { status: 201 })
  }),

  /* admin: payments */
  http.post('/api/v1/payments', async ({ request }) => {
    await delay(300)
    const b = await body<Schemas['CreatePaymentsDto']>(request)
    const out: Payment[] = []
    for (const it of b.items) {
      const r = createPayment(it)
      if (r.err) return r.err
      out.push(r.p)
    }
    return HttpResponse.json({ items: out.map(paymentDto) }, { status: 201 })
  }),
  http.post('/api/v1/payments/:id/void', async ({ params, request }) => {
    const p = payments.find((x) => x.id === params.id)
    if (!p) return error(404, 'Payment not found')
    if (p.voidedAt) return error(409, 'Already voided')
    const { reason } = await body<Schemas['ReasonDto']>(request)
    Object.assign(p, { voidedAt: now(), voidReason: reason })
    return HttpResponse.json(paymentDto(p))
  }),

  /* admin: payment requests */
  http.get('/api/v1/payment-submissions', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const method = url.searchParams.get('method')
    const classId = url.searchParams.get('classId')
    const list = submissions
      .filter(
        (s) =>
          (!status || s.status === status) &&
          (!method || s.method === method) &&
          (!classId || classOf(s.studentId) === classId)
      )
      .sort((a, b) =>
        a.status === 'PENDING'
          ? a.createdAt.localeCompare(b.createdAt)
          : b.createdAt.localeCompare(a.createdAt)
      )
      .map(submissionDto)
    return HttpResponse.json(page(list, url))
  }),
  http.get('/api/v1/payment-submissions/:id', ({ params }) => {
    const s = submissions.find((x) => x.id === params.id)
    if (!s) return error(404, 'Request not found')
    return HttpResponse.json({
      ...submissionDto(s),
      screenshotUrl: URL.createObjectURL(storage.get(s.screenshotKey)!),
    })
  }),
  http.post('/api/v1/payment-submissions/:id/approve', async ({ params }) => {
    await delay(400)
    const s = submissions.find((x) => x.id === params.id)
    if (!s) return error(404, 'Request not found')
    if (s.status !== 'PENDING') return error(409, 'This request was already reviewed')
    const r = createPayment({
      studentFeeId: s.studentFeeId,
      amount: money(s.amount),
      method: s.method,
      paidOn: s.paidOn,
      referenceNo: s.referenceNo,
    })
    if (r.err) return r.err
    Object.assign(s, { status: 'APPROVED', reviewedAt: now(), feePaymentId: r.p.id })
    return HttpResponse.json(paymentDto(r.p))
  }),
  http.post('/api/v1/payment-submissions/:id/decline', async ({ params, request }) => {
    const s = submissions.find((x) => x.id === params.id)
    if (!s) return error(404, 'Request not found')
    if (s.status !== 'PENDING') return error(409, 'This request was already reviewed')
    const { reason } = await body<Schemas['ReasonDto']>(request)
    Object.assign(s, { status: 'DECLINED', declineReason: reason, reviewedAt: now() })
    return HttpResponse.json(submissionDto(s))
  }),

  /* payment details */
  http.get('/api/v1/payment-settings', () => HttpResponse.json(settingsDto())),
  http.put('/api/v1/payment-settings', async ({ request }) => {
    await delay(300)
    const b = await body<Schemas['UpdatePaymentSettingsDto']>(request)
    if (b.qrKey && !storage.has(b.qrKey)) return error(400, 'Upload the QR first')
    settings = { ...settings, ...b }
    return HttpResponse.json(settingsDto())
  }),
  http.get('/api/v1/me/payment-settings', () => HttpResponse.json(settingsDto())),

  /* student: own fees, payments and requests */
  http.get('/api/v1/me/fees', () => {
    const s = summary(fees.filter((f) => f.studentId === meStudent().id))
    return HttpResponse.json({
      ...s,
      items: s.items.map((f) => ({
        ...f,
        payments: f.payments
          .filter((p) => !p.voidedAt)
          .map((p) => without(p, 'voidedAt', 'voidReason')),
      })),
    })
  }),
  http.get('/api/v1/me/payments', () => {
    const mine = new Map(fees.filter((f) => f.studentId === meStudent().id).map((f) => [f.id, f]))
    return HttpResponse.json(
      payments
        .filter((p) => mine.has(p.studentFeeId) && !p.voidedAt)
        .sort((a, b) => b.paidOn.localeCompare(a.paidOn))
        .map((p) => {
          const f = mine.get(p.studentFeeId)!
          return {
            id: p.id,
            paidOn: p.paidOn,
            amount: money(p.amount),
            method: p.method,
            receiptNo: p.receiptNo,
            feeId: f.id,
            feeTitle: f.title,
            feeType: f.feeType,
          }
        })
    )
  }),
  http.get('/api/v1/me/payment-submissions', () =>
    HttpResponse.json(
      submissions
        .filter((s) => s.studentId === meStudent().id)
        .map((s) => {
          return without(submissionDto(s), 'studentId', 'studentName', 'utrSeenBefore')
        })
    )
  ),
  http.post('/api/v1/me/fees/:feeId/payment-submissions', async ({ params, request }) => {
    await delay(500)
    const fee = fees.find((f) => f.id === params.feeId && f.studentId === meStudent().id)
    if (!fee) return error(404, 'Fee not found')
    const b = await body<Schemas['CreatePaymentSubmissionDto']>(request)
    if (!storage.has(b.screenshotKey)) return error(400, 'Upload the screenshot first')
    if (Number(b.amount) > fee.total - paidOf(fee))
      return error(400, 'Amount is more than the remaining balance')
    const s = addSubmission(fee, Number(b.amount), b.method, b.referenceNo, b.paidOn, 0, {
      note: b.note ?? null,
    })
    s.screenshotKey = b.screenshotKey
    return HttpResponse.json(
      without(submissionDto(s), 'studentId', 'studentName', 'utrSeenBefore'),
      { status: 201 }
    )
  }),

  /* dashboard numbers used by the fee overview */
  http.get('/api/v1/dashboard/summary', ({ request }) => {
    const yearId = new URL(request.url).searchParams.get('academicYearId') ?? current.id
    const dtos = fees.filter((f) => f.academicYearId === yearId).map(feeDto)
    const sum = (l: typeof dtos, k: 'totalAmount' | 'paidAmount' | 'remainingAmount') =>
      money(l.reduce((a, f) => a + Number(f[k]), 0))
    const overdue = dtos.filter((f) => f.isOverdue)
    const types = [...new Set(dtos.map((f) => f.feeType))]
    return HttpResponse.json({
      academicYearId: yearId,
      students: {
        total: students.length,
        active: students.filter((s) => s.status === 'ACTIVE').length,
        inactive: students.filter((s) => s.status === 'INACTIVE').length,
        alumni: students.filter((s) => s.status === 'ALUMNI').length,
      },
      fees: {
        totalAmount: sum(dtos, 'totalAmount'),
        collectedAmount: sum(dtos, 'paidAmount'),
        pendingAmount: sum(dtos, 'remainingAmount'),
        overdueAmount: sum(overdue, 'remainingAmount'),
        overdueCount: overdue.length,
        byType: types.map((feeType) => {
          const l = dtos.filter((f) => f.feeType === feeType)
          return {
            feeType,
            totalAmount: sum(l, 'totalAmount'),
            collectedAmount: sum(l, 'paidAmount'),
            pendingAmount: sum(l, 'remainingAmount'),
            overdueAmount: sum(
              l.filter((f) => f.isOverdue),
              'remainingAmount'
            ),
          }
        }),
      },
      feesByStandard: classes
        .filter((c) => c.academicYearId === yearId)
        .map((c) => {
          const l = dtos.filter((x) => classOf(x.studentId, yearId) === c.id)
          const kinds = [...new Set(l.map((x) => x.feeType))]
          return {
            standard: c.standard,
            billedAmount: sum(l, 'totalAmount'),
            collectedAmount: sum(l, 'paidAmount'),
            byType: kinds.map((feeType) => {
              const k = l.filter((x) => x.feeType === feeType)
              return {
                feeType,
                billedAmount: sum(k, 'totalAmount'),
                collectedAmount: sum(k, 'paidAmount'),
              }
            }),
          }
        })
        .filter((s) => Number(s.billedAmount) > 0)
        .sort((a, b) => a.standard.localeCompare(b.standard, undefined, { numeric: true })),
      attention: {
        draftExamsMissingMarks: examStats().draftExamsMissingMarks,
        examsChangedSincePublish: examStats().examsChangedSincePublish,
        expiredInvites: invitations.filter((i) => i.status === 'EXPIRED').length,
        pendingPaymentSubmissions: submissions.filter((s) => s.status === 'PENDING').length,
      },
      recentPayments: payments
        .filter(
          (p) =>
            !p.voidedAt && fees.some((x) => x.id === p.studentFeeId && x.academicYearId === yearId)
        )
        .sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6)
        .map((p) => {
          const fee = fees.find((x) => x.id === p.studentFeeId)!
          return {
            receiptNo: p.receiptNo,
            studentName: nameOf(fee.studentId),
            feeTitle: fee.title,
            feeType: fee.feeType,
            method: p.method,
            amount: money(p.amount),
            paidOn: p.paidOn,
          }
        }),
      recentExams: examStats().recentExams,
    })
  }),
]

function settingsDto(): Schemas['PaymentSettingsDto'] {
  return {
    ...settings,
    qrUrl:
      settings.qrKey && storage.has(settings.qrKey)
        ? URL.createObjectURL(storage.get(settings.qrKey)!)
        : null,
  }
}
