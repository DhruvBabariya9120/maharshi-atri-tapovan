/* eslint-disable react-refresh/only-export-components -- shared labels sit next to the small components that use them */
import { useQuery } from '@tanstack/react-query'
import { api, type Schemas } from '../../api/client'
import { Pill } from '../../ui'

export type FeeType = Schemas['StudentFeeDto']['feeType']
export type Method = Schemas['FeePaymentDto']['method']
export type FeeStatus = Schemas['StudentFeeDto']['status']
export type RequestStatus = Schemas['PaymentSubmissionDto']['status']

export const FEE_TYPES: Record<FeeType, string> = {
  TUITION: 'Tuition',
  HOSTEL: 'Hostel',
  SCHOOL: 'School',
  ACTIVITY: 'Activity',
  WASHING: 'Washing',
  DRESS: 'Dress',
  STATIONERY: 'Stationery',
}

export const METHODS: Record<Method, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank transfer',
  CHEQUE: 'Cheque',
}

const METHOD_DOT: Record<Method, string> = {
  CASH: 'bg-green-600',
  UPI: 'bg-violet-600',
  BANK_TRANSFER: 'bg-blue-600',
  CHEQUE: 'bg-amber-600',
}

/** Money comes from the API as a string ("45000.00"). Format it; never add amounts up here. */
export const inr = (amount: string | number | null | undefined) =>
  amount === null || amount === undefined || amount === ''
    ? '—'
    : '₹' +
      Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Paid share of a fee, for progress bars only (display, not arithmetic on money). */
export const paidPercent = (f: { totalAmount: string; paidAmount: string }) => {
  const total = Number(f.totalAmount)
  return total > 0 ? Math.min(100, Math.round((Number(f.paidAmount) / total) * 100)) : 100
}

export function FeeStatusPill({ status, isOverdue }: { status: FeeStatus; isOverdue?: boolean }) {
  if (status === 'PAID') return <Pill tone="green">Paid</Pill>
  if (isOverdue) return <Pill tone="red">Overdue</Pill>
  if (status === 'PARTIAL') return <Pill tone="blue">Part paid</Pill>
  return <Pill tone="amber">Due</Pill>
}

export function MethodChip({ method }: { method: Method }) {
  return (
    <span className="text-content inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium whitespace-nowrap">
      <span className={`h-2 w-2 rounded-sm ${METHOD_DOT[method]}`} aria-hidden />
      {METHODS[method]}
    </span>
  )
}

export function FeeTypeChip({ type }: { type: FeeType }) {
  return (
    <span className="bg-tint-blue-soft text-brand rounded-md px-2 py-0.5 text-[11px] font-semibold">
      {FEE_TYPES[type]}
    </span>
  )
}

export function ProgressBar({
  percent,
  tone = 'blue',
}: {
  percent: number
  tone?: 'blue' | 'green' | 'red'
}) {
  const fill = { blue: 'bg-brand', green: 'bg-green-600', red: 'bg-red-600' }[tone]
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden>
      <div className={`h-2 rounded-full ${fill}`} style={{ width: `${percent}%` }} />
    </div>
  )
}

const ONES = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const under100 = (n: number) =>
  n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`
const under1000 = (n: number) =>
  n >= 100
    ? `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ' ' + under100(n % 100) : ''}`
    : under100(n)

/** "Rupees twelve thousand five hundred only", using the Indian system (lakh, crore). */
export function amountInWords(amount: string) {
  const [rupees, paise = '0'] = Number(amount).toFixed(2).split('.')
  let n = Number(rupees)
  if (n === 0 && Number(paise) === 0) return 'Rupees zero only'
  const parts: string[] = []
  for (const [size, word] of [
    [10_000_000, 'crore'],
    [100_000, 'lakh'],
    [1000, 'thousand'],
  ] as const) {
    if (n >= size) {
      parts.push(`${under1000(Math.floor(n / size))} ${word}`)
      n %= size
    }
  }
  if (n) parts.push(under1000(n))
  const words = `Rupees ${parts.join(' ')}`.replace(/\s+/g, ' ')
  return Number(paise) ? `${words} and ${under100(Number(paise))} paise only` : `${words} only`
}

/**
 * Student names for fee lists. `GET /fees` only returns studentId, so load the
 * student list once and look names up. ponytail: fine for one school (a few hundred
 * students); replace with names in the fee response once the backend adds them.
 */
export function useStudentNames() {
  const q = useQuery({
    queryKey: ['students', 'names'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const all: Schemas['StudentDto'][] = []
      for (let page = 1; ; page++) {
        const r = await api<Schemas['PaginatedStudentsDto']>('/students', {
          query: { page, limit: 100 },
        })
        all.push(...r.items)
        if (all.length >= r.total || !r.items.length) break
      }
      return new Map(all.map((s) => [s.id, s]))
    },
  })
  return q.data
}

export const REQUEST_STATUS: Record<
  RequestStatus,
  { label: string; tone: 'amber' | 'green' | 'red' }
> = {
  PENDING: { label: 'Waiting', tone: 'amber' },
  APPROVED: { label: 'Approved', tone: 'green' },
  DECLINED: { label: 'Declined', tone: 'red' },
}

/** "Waiting 2 days" from the submitted time. */
export function waited(iso: string) {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

/** Requests waiting more than 2 days get flagged in the queue. */
export const waitedTooLong = (iso: string) => Date.now() - new Date(iso).getTime() > 2 * 86400_000
