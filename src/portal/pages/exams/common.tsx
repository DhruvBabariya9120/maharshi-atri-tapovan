/* eslint-disable react-refresh/only-export-components -- shared labels sit next to the small components that use them */
import type { Schemas } from '../../api/client'
import { Pill } from '../../ui'

export type Exam = Schemas['ExamDto']
export type ExamType = Exam['type']

export const EXAM_TYPES: Record<ExamType, string> = {
  SEMESTER: 'Semester',
  WEEKLY_TEST: 'Weekly test',
  MONTHLY_TEST: 'Monthly test',
  OTHER_TEST: 'Other test',
}

export const TYPE_TONE: Record<ExamType, string> = {
  SEMESTER: 'bg-violet-100 text-violet-700',
  WEEKLY_TEST: 'bg-blue-100 text-blue-700',
  MONTHLY_TEST: 'bg-pink-100 text-pink-700',
  OTHER_TEST: 'bg-amber-100 text-amber-700',
}

export function ExamStatus({ exam }: { exam: Pick<Exam, 'status' | 'changedSinceLastPublish'> }) {
  if (exam.status === 'DRAFT') return <Pill tone="slate">Draft</Pill>
  if (exam.changedSinceLastPublish) return <Pill tone="amber">Changed since publish</Pill>
  return <Pill tone="green">Published</Pill>
}

export const dateRange = (start: string | null, end: string | null) => {
  const f = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  if (!start) return '—'
  if (!end || end.slice(0, 10) === start.slice(0, 10)) return f(start)
  return `${f(start)} – ${f(end)}`
}

/** "1st", "2nd", "3rd", "4th"… for ranks. */
export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export const pctText = (p: number) => `${p.toFixed(2)}%`
