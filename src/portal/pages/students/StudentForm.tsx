import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { FieldWrap, Input, Select } from '../../../components/ui/Field'
import { ApiError, api, type Schemas } from '../../api/client'
import { useClasses, useYears } from '../../api/lookups'
import { Btn, PageHeader, errorText } from '../../ui'
import { BLOOD_GROUPS, fullName, type Student } from './common'

const opt = z.string().trim()
const schema = z.object({
  firstName: z.string().trim().min(1, 'Enter the first name').max(100),
  lastName: z.string().trim().min(1, 'Enter the last name').max(100),
  dob: z.string().min(1, 'Pick the date of birth'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Pick one' }),
  admissionDate: z.string().min(1, 'Pick the admission date'),
  bloodGroup: opt,
  aadhaarNo: opt.refine(
    (v) => !v || /^\d{12}$/.test(v.replace(/\s/g, '')),
    'Aadhaar has 12 digits'
  ),
  motherTongue: opt,
  previousSchool: opt,
  guardianName: z.string().trim().min(1, "Enter the guardian's name"),
  guardianRelation: z.string().trim().min(1, 'Pick the relation'),
  guardianPhone: z
    .string()
    .trim()
    .refine(
      (v) => /^(\+?91)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')),
      'Enter a 10-digit mobile number'
    ),
  guardianEmail: z.email('Enter a valid email. The login invite goes here.'),
  addressLine: opt,
  city: opt,
  state: opt,
  pincode: opt.refine((v) => !v || /^\d{6}$/.test(v), 'PIN code has 6 digits'),
  classId: opt,
  rollNo: opt.refine((v) => !v || /^\d{1,4}$/.test(v), 'Roll no. is a number'),
  boarding: z.enum(['HOSTEL', 'DAY_SCHOLAR']),
  sendInvite: z.boolean(),
})
type Form = z.infer<typeof schema>

const blank = (v: string) => (v === '' ? undefined : v)

function toDto(v: Form): Schemas['UpdateStudentDto'] {
  return {
    firstName: v.firstName,
    lastName: v.lastName,
    dob: v.dob,
    gender: v.gender,
    admissionDate: v.admissionDate,
    bloodGroup: blank(v.bloodGroup) as Schemas['UpdateStudentDto']['bloodGroup'],
    aadhaarNo: blank(v.aadhaarNo.replace(/\s/g, '')),
    motherTongue: blank(v.motherTongue),
    previousSchool: blank(v.previousSchool),
    guardianName: v.guardianName,
    guardianRelation: v.guardianRelation,
    guardianPhone: v.guardianPhone.replace(/[\s-]/g, ''),
    guardianEmail: v.guardianEmail.toLowerCase(),
    addressLine: blank(v.addressLine),
    city: blank(v.city),
    state: blank(v.state),
    pincode: blank(v.pincode),
  }
}

function fromStudent(s: Student): Form {
  return {
    firstName: s.firstName,
    lastName: s.lastName,
    dob: s.dob.slice(0, 10),
    gender: s.gender,
    admissionDate: s.admissionDate.slice(0, 10),
    bloodGroup: s.bloodGroup ?? '',
    aadhaarNo: s.aadhaarNo ?? '',
    motherTongue: s.motherTongue ?? '',
    previousSchool: s.previousSchool ?? '',
    guardianName: s.guardianName,
    guardianRelation: s.guardianRelation,
    guardianPhone: s.guardianPhone,
    guardianEmail: s.guardianEmail,
    addressLine: s.addressLine ?? '',
    city: s.city ?? '',
    state: s.state ?? '',
    pincode: s.pincode ?? '',
    classId: '',
    rollNo: '',
    boarding: 'DAY_SCHOLAR',
    sendInvite: false,
  }
}

const today = new Date().toISOString().slice(0, 10)
const EMPTY = {
  firstName: '',
  lastName: '',
  dob: '',
  admissionDate: today,
  bloodGroup: '',
  aadhaarNo: '',
  motherTongue: '',
  previousSchool: '',
  guardianName: '',
  guardianRelation: 'Father',
  guardianPhone: '',
  guardianEmail: '',
  addressLine: '',
  city: '',
  state: 'Gujarat',
  pincode: '',
  classId: '',
  rollNo: '',
  boarding: 'DAY_SCHOLAR',
  sendInvite: true,
} as Partial<Form> as Form // gender stays unset until picked

/** Map 400 messages like "items.0.guardianEmail must be an email" onto the matching field. */
function applyServerErrors(
  err: unknown,
  setError: (f: FieldPath<Form>, e: { message: string }) => void
) {
  if (!(err instanceof ApiError) || err.status !== 400) return false
  let mapped = false
  for (const m of err.messages) {
    const hit = /^(?:items\.\d+\.)?(\w+)\s+(.+)$/.exec(m)
    if (hit && hit[1] in EMPTY) {
      setError(hit[1] as FieldPath<Form>, {
        message: hit[2].charAt(0).toUpperCase() + hit[2].slice(1),
      })
      mapped = true
    }
  }
  return mapped
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dt flex flex-col gap-4 p-5 sm:p-6">
      <h2 className="font-display text-heading text-[17px] font-semibold">{title}</h2>
      <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}

export function StudentForm() {
  const { id } = useParams()
  const editing = !!id
  const student = useQuery({
    queryKey: ['students', id],
    queryFn: () => api<Student>(`/students/${id}`),
    enabled: editing,
  })
  if (editing && student.isPending)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    )
  if (editing && student.isError)
    return (
      <p className="text-sm text-red-700">
        {errorText(student.error, "Couldn't load this student.")}
      </p>
    )
  return <FormBody student={student.data} />
}

function FormBody({ student }: { student?: Student }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const years = useYears()
  const classes = useClasses(years.current?.id)
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: student ? fromStudent(student) : EMPTY,
  })
  const e = form.formState.errors
  const reg = form.register
  const classId = useWatch({ control: form.control, name: 'classId' })

  const save = useMutation({
    mutationFn: async (v: Form) => {
      if (student)
        return api<Student>(`/students/${student.id}`, { method: 'PATCH', body: toDto(v) })
      const item: Schemas['CreateStudentDto'] = {
        ...(toDto(v) as Schemas['CreateStudentDto']),
        sendInvite: v.sendInvite,
        enrollment:
          v.classId && years.current
            ? {
                academicYearId: years.current.id,
                classId: v.classId,
                rollNo: v.rollNo ? Number(v.rollNo) : undefined,
                boarding: v.boarding,
              }
            : undefined,
      }
      const r = await api<Schemas['StudentsResultDto']>('/students', {
        method: 'POST',
        body: { items: [item] },
      })
      return r.items[0]
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success(student ? 'Changes saved' : `Added ${fullName(s)} · ${s.admissionNo}`)
      navigate(`/admin/students/${s.id}`)
    },
    onError: (err) => {
      if (!applyServerErrors(err, form.setError)) toast.error(errorText(err))
    },
  })

  const field = (
    name: FieldPath<Form>,
    label: string,
    extra: Partial<Parameters<typeof Input>[0]> = {},
    required = false
  ) => (
    <FieldWrap
      label={label}
      htmlFor={name}
      required={required}
      error={e[name as keyof Form]?.message}
    >
      <Input id={name} error={e[name as keyof Form]?.message} {...extra} {...reg(name)} />
    </FieldWrap>
  )

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
      className="flex flex-col gap-5"
    >
      <nav aria-label="Breadcrumb" className="text-muted flex gap-2 text-[13px]">
        <Link to="/admin/students" className="hover:text-brand">
          Students
        </Link>
        <span aria-hidden>/</span>
        {student ? (
          <>
            <Link to={`/admin/students/${student.id}`} className="hover:text-brand">
              {fullName(student)}
            </Link>
            <span aria-hidden>/</span>
            <span>Edit</span>
          </>
        ) : (
          <span>Add student</span>
        )}
      </nav>
      <PageHeader
        title={student ? `Edit ${fullName(student)}` : 'Add student'}
        sub={student ? student.admissionNo : 'The admission number is created when you save.'}
      />

      <Section title="Personal details">
        {field('firstName', 'First name', {}, true)}
        {field('lastName', 'Last name', {}, true)}
        {field('dob', 'Date of birth', { type: 'date', max: today }, true)}
        <FieldWrap label="Gender" htmlFor="gender" required error={e.gender?.message}>
          <Select id="gender" error={e.gender?.message} {...reg('gender')}>
            <option value="">Choose…</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
        </FieldWrap>
        <FieldWrap label="Blood group" htmlFor="bloodGroup">
          <Select id="bloodGroup" {...reg('bloodGroup')}>
            <option value="">Not known</option>
            {BLOOD_GROUPS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </FieldWrap>
        {field('aadhaarNo', 'Aadhaar no.', { inputMode: 'numeric', placeholder: '12 digits' })}
        {field('motherTongue', 'Mother tongue', { placeholder: 'Gujarati' })}
        {field('previousSchool', 'Previous school')}
        {field('admissionDate', 'Admission date', { type: 'date' }, true)}
      </Section>

      <Section title="Guardian">
        {field('guardianName', 'Guardian name', {}, true)}
        <FieldWrap
          label="Relation"
          htmlFor="guardianRelation"
          required
          error={e.guardianRelation?.message}
        >
          <Select id="guardianRelation" {...reg('guardianRelation')}>
            <option>Father</option>
            <option>Mother</option>
            <option>Guardian</option>
            <option>Other</option>
          </Select>
        </FieldWrap>
        {field(
          'guardianPhone',
          'Mobile',
          { type: 'tel', inputMode: 'tel', placeholder: '98765 43210' },
          true
        )}
        <div className="sm:col-span-2 lg:col-span-3">
          <FieldWrap
            label="Email"
            htmlFor="guardianEmail"
            required
            hint="The student signs in to the portal with this email."
            error={e.guardianEmail?.message}
          >
            <Input
              id="guardianEmail"
              type="email"
              error={e.guardianEmail?.message}
              {...reg('guardianEmail')}
            />
          </FieldWrap>
        </div>
      </Section>

      <Section title="Address">
        <div className="sm:col-span-2 lg:col-span-3">{field('addressLine', 'Address line')}</div>
        {field('city', 'City')}
        {field('state', 'State')}
        {field('pincode', 'PIN code', { inputMode: 'numeric' })}
      </Section>

      {!student && (
        <Section title={`Enrollment${years.current ? ` · ${years.current.name}` : ''}`}>
          <FieldWrap
            label="Class"
            htmlFor="classId"
            hint="Optional. You can enroll later from the profile."
          >
            <Select id="classId" {...reg('classId')}>
              <option value="">Not enrolled yet</option>
              {classes.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.standard}
                </option>
              ))}
            </Select>
          </FieldWrap>
          {classId && field('rollNo', 'Roll no.', { inputMode: 'numeric' })}
          {classId && (
            <FieldWrap label="Boarding" htmlFor="boarding">
              <Select id="boarding" {...reg('boarding')}>
                <option value="DAY_SCHOLAR">Day scholar</option>
                <option value="HOSTEL">Hostel</option>
              </Select>
            </FieldWrap>
          )}
          <label className="flex cursor-pointer items-start gap-2.5 text-sm sm:col-span-2 lg:col-span-3">
            <input
              type="checkbox"
              className="accent-brand mt-0.5 h-4.5 w-4.5"
              {...reg('sendInvite')}
            />
            <span>
              Email a portal login invite to the guardian after saving. The link works for 72 hours.
            </span>
          </label>
        </Section>
      )}

      <div className="flex flex-wrap justify-end gap-2.5">
        <Link
          to={student ? `/admin/students/${student.id}` : '/admin/students'}
          className="border-border text-heading hover:border-brand hover:text-brand inline-flex min-h-11 items-center rounded-full border bg-white px-5 text-sm font-medium"
        >
          Cancel
        </Link>
        <Btn type="submit" busy={save.isPending}>
          {student ? 'Save changes' : 'Save student'}
        </Btn>
      </div>
    </form>
  )
}
