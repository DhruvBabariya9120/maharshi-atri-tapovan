import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, ExternalLink, FileText, Loader2, Mail, Pencil, Trash2, Upload } from 'lucide-react'
import { Input, Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { checkFile, uploadFile, useClasses, useYears } from '../../api/lookups'
import { Btn, ConfirmDialog, Dialog, Pill, TableState, errorText, fmtDate } from '../../ui'
import {
  BOARDING,
  DOC_TYPES,
  GENDERS,
  STATUS,
  StatusPill,
  StudentAvatar,
  fullName,
  type DocType,
  type Student,
  type StudentStatus,
} from './common'

type Enrollment = Schemas['EnrollmentDto']
type Doc = Schemas['StudentDocumentDto']

const TABS = [
  ['overview', 'Overview'],
  ['enrollment', 'Enrollment history'],
  ['documents', 'Documents'],
  ['fees', 'Fees'],
  ['results', 'Results'],
] as const

export function StudentProfile() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'overview'
  const student = useQuery({
    queryKey: ['students', id],
    queryFn: () => api<Student>(`/students/${id}`),
  })
  const [statusOpen, setStatusOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)

  const setStudent = (s: Student) => {
    qc.setQueryData(['students', id], s)
    qc.invalidateQueries({ queryKey: ['students'], exact: false, refetchType: 'none' })
  }

  const photo = useMutation({
    mutationFn: async (file: File) => {
      const photoKey = await uploadFile(file, 'STUDENT_PHOTO', id)
      return api<Student>(`/students/${id}/photo`, { method: 'PUT', body: { photoKey } })
    },
    onSuccess: (s) => {
      setStudent(s)
      toast.success('Photo updated')
    },
    onError: (err) => toast.error(errorText(err, (err as Error).message)),
  })
  const invite = useMutation({
    mutationFn: () => api('/invitations', { method: 'POST', body: { items: [{ studentId: id }] } }),
    onSuccess: () => toast.success(`Login invite sent to ${student.data?.guardianEmail}`),
    onError: (err) => toast.error(errorText(err)),
  })
  const remove = useMutation({
    mutationFn: () => api(`/students/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Student archived')
      qc.invalidateQueries({ queryKey: ['students'] })
      navigate('/admin/students', { replace: true })
    },
    onError: (err) => {
      setDeleting(false)
      toast.error(errorText(err))
    },
  })

  if (student.isPending)
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </div>
    )
  if (student.isError)
    return (
      <p className="text-sm text-red-700">
        {errorText(student.error, "Couldn't load this student.")}
      </p>
    )
  const s = student.data

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="text-muted flex gap-2 text-[13px]">
        <Link to="/admin/students" className="hover:text-brand">
          Students
        </Link>
        <span aria-hidden>/</span>
        <span>{fullName(s)}</span>
      </nav>

      <section className="dt flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <StudentAvatar student={s} size={84} photo />
            <button
              type="button"
              aria-label={s.hasPhoto ? 'Change photo' : 'Add photo'}
              disabled={photo.isPending}
              onClick={() => photoInput.current?.click()}
              className="bg-brand absolute -right-1.5 -bottom-1.5 grid h-8 w-8 place-items-center rounded-full border-2 border-white text-white"
            >
              {photo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                const problem = checkFile(f, 'STUDENT_PHOTO')
                if (problem) toast.error(problem)
                else photo.mutate(f)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-heading text-[26px] font-semibold">{fullName(s)}</h1>
              <StatusPill status={s.status} />
            </div>
            <div className="text-content flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span>
                <span className="text-muted">Admission no.</span>{' '}
                <span className="font-mono">{s.admissionNo}</span>
              </span>
              <span>
                <span className="text-muted">Admitted</span> {fmtDate(s.admissionDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Btn
            variant="outline"
            busy={invite.isPending}
            onClick={() => invite.mutate()}
            title={`Email a login invite to ${s.guardianEmail}`}
          >
            <Mail className="h-4 w-4" aria-hidden /> Send login invite
          </Btn>
          <Btn variant="outline" onClick={() => setStatusOpen(true)}>
            Change status
          </Btn>
          <Link
            to={`/admin/students/${s.id}/edit`}
            className="bg-brand hover:bg-brand-dark inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white"
          >
            <Pencil className="h-4 w-4" aria-hidden /> Edit details
          </Link>
        </div>
      </section>

      <nav
        aria-label="Student sections"
        className="border-border flex gap-7 overflow-x-auto border-b"
      >
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => setParams({ tab: key }, { replace: true })}
            className={`min-h-11 border-b-2 px-1 text-sm whitespace-nowrap ${tab === key ? 'border-brand text-brand font-semibold' : 'text-muted hover:text-brand border-transparent font-medium'}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <Overview s={s} onArchive={() => setDeleting(true)} />}
      {tab === 'enrollment' && <Enrollments studentId={s.id} />}
      {tab === 'documents' && <Documents studentId={s.id} />}
      {(tab === 'fees' || tab === 'results') && (
        <div className="dt text-muted p-10 text-center text-sm">
          {tab === 'fees'
            ? 'Fees for this student arrive in phase 3.'
            : 'Exam results arrive in phase 4.'}
        </div>
      )}

      <StatusDialog
        open={statusOpen}
        student={s}
        onClose={() => setStatusOpen(false)}
        onSaved={setStudent}
      />
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title={`Archive ${fullName(s)}?`}
        body="The student is removed from lists and can't sign in. Their fees, receipts and results are kept."
        confirmLabel="Archive student"
        busy={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}

function Detail({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-muted text-xs font-medium">{label}</dt>
      <dd className="text-heading mt-0.5 text-sm">{children || '—'}</dd>
    </div>
  )
}

function Overview({ s, onArchive }: { s: Student; onArchive: () => void }) {
  const address = [s.addressLine, s.city, s.state, s.pincode].filter(Boolean).join(', ')
  return (
    <div className="flex flex-wrap items-start gap-5">
      <section className="dt flex min-w-0 flex-[2_1_460px] flex-col gap-4 p-5 sm:p-6">
        <h2 className="font-display text-heading text-[17px] font-semibold">Personal details</h2>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
          <Detail label="Date of birth">{fmtDate(s.dob)}</Detail>
          <Detail label="Gender">{GENDERS[s.gender]}</Detail>
          <Detail label="Blood group">{s.bloodGroup}</Detail>
          <Detail label="Aadhaar (last 4)">
            {s.aadhaarNo ? `•••• ${s.aadhaarNo.slice(-4)}` : ''}
          </Detail>
          <Detail label="Mother tongue">{s.motherTongue}</Detail>
          <Detail label="Previous school">{s.previousSchool}</Detail>
        </dl>
      </section>
      <section className="dt flex min-w-0 flex-[1_1_300px] flex-col gap-4 p-5 sm:p-6">
        <h2 className="font-display text-heading text-[17px] font-semibold">
          Guardian and address
        </h2>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Detail label="Guardian">{`${s.guardianName} (${s.guardianRelation})`}</Detail>
          <Detail label="Mobile">{s.guardianPhone}</Detail>
          <Detail label="Email (portal sign-in)" wide>
            {s.guardianEmail}
          </Detail>
          <Detail label="Address" wide>
            {address}
          </Detail>
        </dl>
        <button
          type="button"
          onClick={onArchive}
          className="mt-2 inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-red-700 hover:underline"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Archive student
        </button>
      </section>
    </div>
  )
}

function StatusDialog({
  open,
  student,
  onClose,
  onSaved,
}: {
  open: boolean
  student: Student
  onClose: () => void
  onSaved: (s: Student) => void
}) {
  const [status, setStatus] = useState<StudentStatus>(student.status)
  const save = useMutation({
    mutationFn: () =>
      api<Student>(`/students/${student.id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: (s) => {
      onSaved(s)
      toast.success(`${fullName(s)} is now ${STATUS[s.status].label.toLowerCase()}`)
      onClose()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const help: Record<StudentStatus, string> = {
    ACTIVE: 'Studying at the school now.',
    INACTIVE: 'Left or on a break. Hidden from active lists.',
    ALUMNI: 'Finished school. The portal becomes read-only.',
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Change status"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            busy={save.isPending}
            disabled={status === student.status}
            onClick={() => save.mutate()}
          >
            Save status
          </Btn>
        </>
      }
    >
      <fieldset className="flex flex-col gap-2.5">
        <legend className="sr-only">Status</legend>
        {(Object.keys(STATUS) as StudentStatus[]).map((k) => (
          <label
            key={k}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 ${status === k ? 'border-brand bg-tint-blue-soft' : 'border-border'}`}
          >
            <input
              type="radio"
              name="status"
              className="accent-brand mt-0.5"
              checked={status === k}
              onChange={() => setStatus(k)}
            />
            <span className="flex flex-col">
              <b className="text-heading">{STATUS[k].label}</b>
              <span className="text-muted text-[13px]">{help[k]}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </Dialog>
  )
}

function Enrollments({ studentId }: { studentId: string }) {
  const qc = useQueryClient()
  const years = useYears()
  const allClasses = useClasses()
  const list = useQuery({
    queryKey: ['students', studentId, 'enrollments'],
    queryFn: () => api<Enrollment[]>(`/students/${studentId}/enrollments`),
  })
  const [editing, setEditing] = useState<Enrollment | 'new' | null>(null)
  const items = [...(list.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const hasCurrent = items.some((e) => e.academicYearId === years.current?.id)

  return (
    <section className="dt">
      <div className="dt-bar">
        <h2 className="dt-title">Enrollment history</h2>
        {!hasCurrent && years.current && (
          <Btn onClick={() => setEditing('new')}>Enroll in {years.current.name}</Btn>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Year</th>
              <th>Class</th>
              <th>Roll no.</th>
              <th>Boarding</th>
              <th className="text-right!">Actions</th>
            </tr>
          </thead>
          <tbody>
            <TableState
              cols={5}
              loading={list.isPending}
              error={list.error}
              empty={!items.length}
              emptyText="Not enrolled in any class yet."
              onRetry={() => list.refetch()}
            />
            {items.map((e) => (
              <tr key={e.id}>
                <td className="text-heading font-semibold">
                  {years.nameOf(e.academicYearId)}{' '}
                  {e.academicYearId === years.current?.id && <Pill tone="blue">Current</Pill>}
                </td>
                <td>{allClasses.nameOf(e.classId)}</td>
                <td className="tabular-nums">{e.rollNo ?? '—'}</td>
                <td>{BOARDING[e.boarding]}</td>
                <td>
                  <div className="ra">
                    <button
                      type="button"
                      aria-label="Edit enrollment"
                      onClick={() => setEditing(e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <EnrollmentDialog
          studentId={studentId}
          enrollment={editing === 'new' ? null : editing}
          yearId={editing === 'new' ? (years.current?.id ?? '') : editing.academicYearId}
          yearName={years.nameOf(
            editing === 'new' ? (years.current?.id ?? '') : editing.academicYearId
          )}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            qc.invalidateQueries({ queryKey: ['students', studentId, 'enrollments'] })
          }}
        />
      )}
    </section>
  )
}

function EnrollmentDialog({
  studentId,
  enrollment,
  yearId,
  yearName,
  onClose,
  onSaved,
}: {
  studentId: string
  enrollment: Enrollment | null
  yearId: string
  yearName: string
  onClose: () => void
  onSaved: () => void
}) {
  const classes = useClasses(yearId)
  const [classId, setClassId] = useState(enrollment?.classId ?? '')
  const [rollNo, setRollNo] = useState(enrollment?.rollNo?.toString() ?? '')
  const [boarding, setBoarding] = useState<Enrollment['boarding']>(
    enrollment?.boarding ?? 'DAY_SCHOLAR'
  )
  const save = useMutation({
    mutationFn: () => {
      const roll = rollNo ? Number(rollNo) : undefined
      return enrollment
        ? api(`/enrollments/${enrollment.id}`, {
            method: 'PATCH',
            body: { classId, rollNo: roll, boarding },
          })
        : api('/enrollments', {
            method: 'POST',
            body: {
              items: [{ studentId, academicYearId: yearId, classId, rollNo: roll, boarding }],
            },
          })
    },
    onSuccess: () => {
      toast.success(enrollment ? 'Enrollment updated' : `Enrolled in ${yearName}`)
      onSaved()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  return (
    <Dialog
      open
      onClose={onClose}
      title={enrollment ? `Edit enrollment · ${yearName}` : `Enroll in ${yearName}`}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            busy={save.isPending}
            disabled={!classId || (!!rollNo && !/^\d+$/.test(rollNo))}
            onClick={() => save.mutate()}
          >
            Save
          </Btn>
        </>
      }
    >
      <label htmlFor="en-class" className="text-heading text-sm font-medium">
        Class
      </label>
      <Select id="en-class" value={classId} onChange={(e) => setClassId(e.target.value)}>
        <option value="">Choose a class…</option>
        {classes.items.map((c) => (
          <option key={c.id} value={c.id}>
            {c.standard}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="en-roll" className="text-heading text-sm font-medium">
            Roll no.
          </label>
          <Input
            id="en-roll"
            inputMode="numeric"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value.trim())}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="en-board" className="text-heading text-sm font-medium">
            Boarding
          </label>
          <Select
            id="en-board"
            value={boarding}
            onChange={(e) => setBoarding(e.target.value as Enrollment['boarding'])}
          >
            <option value="DAY_SCHOLAR">Day scholar</option>
            <option value="HOSTEL">Hostel</option>
          </Select>
        </div>
      </div>
    </Dialog>
  )
}

const fmtSize = (b: number) =>
  b >= 1024 * 1024
    ? `${(b / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(b / 1024))} KB`

function Documents({ studentId }: { studentId: string }) {
  const qc = useQueryClient()
  const docs = useQuery({
    queryKey: ['students', studentId, 'documents'],
    queryFn: () => api<Doc[]>(`/students/${studentId}/documents`),
  })
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<DocType>('SCHOOL_LEAVING_CERTIFICATE')
  const [title, setTitle] = useState('')
  const [deleting, setDeleting] = useState<Doc | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const refresh = () => qc.invalidateQueries({ queryKey: ['students', studentId, 'documents'] })

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose a file first')
      const key = await uploadFile(file, 'STUDENT_DOCUMENT', studentId)
      return api<Doc>(`/students/${studentId}/documents`, {
        method: 'POST',
        body: {
          type,
          title: title.trim() || DOC_TYPES[type],
          key,
          mimeType: file.type as Schemas['CreateStudentDocumentDto']['mimeType'],
          sizeBytes: file.size,
        },
      })
    },
    onSuccess: (d) => {
      toast.success(`Uploaded ${d.title}`)
      setFile(null)
      setTitle('')
      refresh()
    },
    onError: (err) => toast.error(errorText(err, (err as Error).message)),
  })
  const open = useMutation({
    mutationFn: (d: Doc) => api<Schemas['SignedUrlDto']>(`/documents/${d.id}/url`),
    onSuccess: (r) => {
      // Opened after an await, so some browsers treat it as a pop-up; offer a click instead.
      if (!window.open(r.url, '_blank', 'noopener'))
        toast('Your browser blocked the new tab.', {
          action: { label: 'Open', onClick: () => window.open(r.url, '_blank', 'noopener') },
        })
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const remove = useMutation({
    mutationFn: (d: Doc) => api(`/documents/${d.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Document deleted')
      setDeleting(null)
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })

  const pick = (f: File | undefined) => {
    if (!f) return
    const problem = checkFile(f, 'STUDENT_DOCUMENT')
    if (problem) return toast.error(problem)
    setFile(f)
  }
  const items = [...(docs.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex flex-col gap-5">
      <section className="dt flex flex-wrap items-end gap-4 p-5">
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            pick(e.dataTransfer.files[0])
          }}
          className="bg-tint-blue-soft flex min-h-28 flex-[2_1_300px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-blue-200 px-4 py-4 text-center"
        >
          {file ? (
            <>
              <FileText className="text-brand h-6 w-6" aria-hidden />
              <b className="text-heading text-sm">{file.name}</b>
              <span className="text-muted text-xs">
                {fmtSize(file.size)} · click to choose another
              </span>
            </>
          ) : (
            <>
              <Upload className="text-brand h-6 w-6" aria-hidden />
              <span className="text-heading text-sm">
                <b>Drop a file here</b> or click to browse
              </span>
              <span className="text-muted text-xs">PDF, JPG or PNG, up to 10 MB</span>
            </>
          )}
        </button>
        <input
          ref={input}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div className="flex flex-[1_1_200px] flex-col gap-1.5">
          <label htmlFor="doc-type" className="text-heading text-[13px] font-medium">
            Document type
          </label>
          <Select id="doc-type" value={type} onChange={(e) => setType(e.target.value as DocType)}>
            {(Object.keys(DOC_TYPES) as DocType[]).map((k) => (
              <option key={k} value={k}>
                {DOC_TYPES[k]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-[1_1_200px] flex-col gap-1.5">
          <label htmlFor="doc-title" className="text-heading text-[13px] font-medium">
            Title
          </label>
          <Input
            id="doc-title"
            placeholder={DOC_TYPES[type]}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <Btn busy={upload.isPending} disabled={!file} onClick={() => upload.mutate()}>
          Upload
        </Btn>
      </section>

      <section className="dt">
        <div className="dt-bar">
          <h2 className="dt-title">
            Documents <span className="dt-count">{items.length}</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th className="text-right!">Actions</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                cols={5}
                loading={docs.isPending}
                error={docs.error}
                empty={!items.length}
                emptyText="No documents uploaded yet."
                onRetry={() => docs.refetch()}
              />
              {items.map((d) => (
                <tr key={d.id}>
                  <td className="text-heading font-medium">{d.title}</td>
                  <td>
                    <Pill tone="slate">{DOC_TYPES[d.type]}</Pill>
                  </td>
                  <td className="tabular-nums">{fmtSize(d.sizeBytes)}</td>
                  <td className="text-muted text-[13px]">{fmtDate(d.createdAt)}</td>
                  <td>
                    <div className="ra">
                      <button
                        type="button"
                        aria-label={`Open ${d.title}`}
                        title="Open (link works for a few minutes)"
                        disabled={open.isPending}
                        onClick={() => open.mutate(d)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="danger"
                        aria-label={`Delete ${d.title}`}
                        onClick={() => setDeleting(d)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-muted text-[13px]">
        Files are stored privately. Open gives you a link that only works for a few minutes.
      </p>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.title ?? ''}?`}
        body="The file is removed for good."
        confirmLabel="Delete document"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </div>
  )
}
