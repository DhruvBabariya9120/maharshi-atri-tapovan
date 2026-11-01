/* eslint-disable react-refresh/only-export-components -- shared labels sit next to the small components that use them */
import { useQuery } from '@tanstack/react-query'
import { api, type Schemas } from '../../api/client'
import { Pill } from '../../ui'

export type Student = Schemas['StudentDto']
export type StudentStatus = Student['status']
export type DocType = Schemas['StudentDocumentDto']['type']

export const STATUS: Record<StudentStatus, { label: string; tone: 'green' | 'slate' | 'blue' }> = {
  ACTIVE: { label: 'Active', tone: 'green' },
  INACTIVE: { label: 'Inactive', tone: 'slate' },
  ALUMNI: { label: 'Alumni', tone: 'blue' },
}

export const DOC_TYPES: Record<DocType, string> = {
  SCHOOL_LEAVING_CERTIFICATE: 'School leaving certificate',
  STUDENT_AADHAAR: 'Student Aadhaar card',
  PARENT_AADHAAR: 'Parent Aadhaar card',
  INCOME_CERTIFICATE: 'Income certificate',
  LAST_YEAR_MARKSHEET: 'Last year marksheet',
  OTHER: 'Other',
}

export const GENDERS: Record<Student['gender'], string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
}
export const BOARDING = { HOSTEL: 'Hostel', DAY_SCHOLAR: 'Day scholar' } as const
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

export const fullName = (s: Pick<Student, 'firstName' | 'lastName'>) =>
  `${s.firstName} ${s.lastName}`.trim()
const initials = (s: Pick<Student, 'firstName' | 'lastName'>) =>
  `${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`.toUpperCase()

const AVATAR_TONES = [
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
]
const toneFor = (id: string) =>
  AVATAR_TONES[parseInt(id.replace(/\D/g, '').slice(-4) || '0', 10) % AVATAR_TONES.length]

export function StatusPill({ status }: { status: StudentStatus }) {
  return <Pill tone={STATUS[status].tone}>{STATUS[status].label}</Pill>
}

/** Initials avatar; with `photo`, fetches the short-lived signed URL when the student has one. */
export function StudentAvatar({
  student,
  size = 36,
  photo = false,
}: {
  student: Student
  size?: number
  photo?: boolean
}) {
  const url = useQuery({
    queryKey: ['students', student.id, 'photo-url', student.updatedAt],
    queryFn: () => api<Schemas['SignedUrlDto']>(`/students/${student.id}/photo-url`),
    enabled: photo && student.hasPhoto,
    staleTime: 4 * 60_000, // signed URLs are short-lived
  })
  const style = { width: size, height: size, fontSize: Math.round(size * 0.34) }
  if (url.data)
    return (
      <img src={url.data.url} alt="" style={style} className="shrink-0 rounded-2xl object-cover" />
    )
  return (
    <span
      style={style}
      className={`grid shrink-0 place-items-center rounded-xl font-bold ${toneFor(student.id)}`}
      aria-hidden
    >
      {initials(student)}
    </span>
  )
}
