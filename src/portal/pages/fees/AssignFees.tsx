import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { FieldWrap, Input, Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { useClasses, useYears } from '../../api/lookups'
import { Btn, PageHeader, errorText } from '../../ui'
import { StudentAvatar, fullName } from '../students/common'
import { FEE_TYPES, inr, type FeeType } from './common'

type Mode = 'class' | 'student'
const MONEY = /^\d{1,9}(\.\d{1,2})?$/

export function AssignFees() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const years = useYears()
  const yearId = years.current?.id ?? ''
  const classes = useClasses(yearId)

  const [mode, setMode] = useState<Mode>(params.get('student') ? 'student' : 'class')
  const [classId, setClassId] = useState('')
  const [boarding, setBoarding] = useState<'' | 'HOSTEL' | 'DAY_SCHOLAR'>('')
  const [studentId, setStudentId] = useState(params.get('student') ?? '')
  const [search, setSearch] = useState('')
  const [feeType, setFeeType] = useState<FeeType>('TUITION')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  const found = useQuery({
    queryKey: ['students', 'pick', search],
    queryFn: () =>
      api<Schemas['PaginatedStudentsDto']>('/students', {
        query: { q: search, status: 'ACTIVE', limit: 8 },
      }),
    enabled: mode === 'student' && search.trim().length >= 2,
  })
  const picked = useQuery({
    queryKey: ['students', studentId],
    queryFn: () => api<Schemas['StudentDto']>(`/students/${studentId}`),
    enabled: mode === 'student' && !!studentId,
  })

  const defaultTitle = `${FEE_TYPES[feeType]} ${years.current?.name ?? ''}`.trim()
  const feeTitle = title.trim() || defaultTitle

  const save = useMutation({
    mutationFn: async () => {
      const fee = {
        title: feeTitle,
        feeType,
        totalAmount: Number(amount).toFixed(2),
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      }
      if (mode === 'class') {
        const r = await api<Schemas['ClassFeesResultDto']>(`/classes/${classId}/fees`, {
          method: 'POST',
          body: { ...fee, boarding: boarding || undefined },
        })
        return { kind: 'class' as const, ...r }
      }
      await api<Schemas['FeesResultDto']>('/fees', {
        method: 'POST',
        body: { items: [{ ...fee, studentId, academicYearId: yearId }] },
      })
      return { kind: 'student' as const }
    },
    onSuccess: (r) => {
      // New bills change the fee list, the totals and the student's own fees tab.
      qc.invalidateQueries({ queryKey: ['fees'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({
        predicate: (q) => q.queryKey[0] === 'students' && q.queryKey[2] === 'fees',
      })
      if (r.kind === 'class') {
        toast.success(
          `Billed ${r.created} ${r.created === 1 ? 'student' : 'students'} in ${classes.nameOf(classId)}` +
            (r.skipped ? `. Skipped ${r.skipped} who already had "${feeTitle}".` : '')
        )
        navigate('/admin/fees')
      } else {
        toast.success(
          `Added "${feeTitle}" for ${picked.data ? fullName(picked.data) : 'the student'}`
        )
        navigate(`/admin/students/${studentId}?tab=fees`)
      }
    },
    onError: (err) => toast.error(errorText(err)),
  })

  const problem =
    mode === 'class' && !classId
      ? 'Pick a class.'
      : mode === 'student' && !studentId
        ? 'Pick a student.'
        : !MONEY.test(amount) || Number(amount) <= 0
          ? 'Enter the amount per student.'
          : null

  const seg = (on: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-medium ${on ? 'border-brand bg-tint-blue text-brand' : 'border-border text-content bg-white'}`

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="text-muted flex gap-2 text-[13px]">
        <Link to="/admin/fees" className="hover:text-brand">
          Fees
        </Link>
        <span aria-hidden>/</span>
        <span>Assign fees</span>
      </nav>
      <PageHeader
        title="Assign fees"
        sub={years.current ? `Bills are created in ${years.current.name}.` : undefined}
      />

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-5">
          <section className="dt flex flex-col gap-4 p-5 sm:p-6">
            <h2 className="font-display text-heading text-[17px] font-semibold">Who pays</h2>
            <div role="group" aria-label="Who pays" className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={mode === 'class'}
                className={seg(mode === 'class')}
                onClick={() => setMode('class')}
              >
                A whole class
              </button>
              <button
                type="button"
                aria-pressed={mode === 'student'}
                className={seg(mode === 'student')}
                onClick={() => setMode('student')}
              >
                One student
              </button>
            </div>
            {mode === 'class' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldWrap label="Class" htmlFor="af-class" required>
                  <Select
                    id="af-class"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    <option value="">Choose a class…</option>
                    {classes.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.standard}
                      </option>
                    ))}
                  </Select>
                </FieldWrap>
                <FieldWrap label="Only" htmlFor="af-board">
                  <Select
                    id="af-board"
                    value={boarding}
                    onChange={(e) => setBoarding(e.target.value as typeof boarding)}
                  >
                    <option value="">All students in the class</option>
                    <option value="HOSTEL">Hostel students</option>
                    <option value="DAY_SCHOLAR">Day scholars</option>
                  </Select>
                </FieldWrap>
              </div>
            ) : picked.data ? (
              <div className="border-brand bg-tint-blue-soft flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
                <span className="flex items-center gap-3">
                  <StudentAvatar student={picked.data} size={36} />
                  <span className="flex flex-col">
                    <b className="text-heading">{fullName(picked.data)}</b>
                    <small className="text-muted font-mono text-xs">
                      {picked.data.admissionNo}
                    </small>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setStudentId('')}
                  className="text-brand text-sm font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="border-border text-muted flex min-h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm">
                  <Search className="h-4 w-4" aria-hidden />
                  <input
                    aria-label="Find a student"
                    placeholder="Type a name or admission no."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-heading flex-1 bg-transparent outline-none"
                  />
                </label>
                {(found.data?.items ?? []).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStudentId(s.id)}
                    className="border-border hover:border-brand flex items-center gap-3 rounded-xl border bg-white p-2.5 text-left"
                  >
                    <StudentAvatar student={s} size={32} />
                    <span className="flex flex-col">
                      <b className="text-heading text-sm">{fullName(s)}</b>
                      <small className="text-muted font-mono text-xs">{s.admissionNo}</small>
                    </span>
                  </button>
                ))}
                {found.data && !found.data.items.length && (
                  <p className="text-muted text-sm">No active students match.</p>
                )}
              </div>
            )}
          </section>

          <section className="dt flex flex-col gap-4 p-5 sm:p-6">
            <h2 className="font-display text-heading text-[17px] font-semibold">Fee</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrap label="Fee type" htmlFor="af-type" required>
                <Select
                  id="af-type"
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value as FeeType)}
                >
                  {(Object.keys(FEE_TYPES) as FeeType[]).map((t) => (
                    <option key={t} value={t}>
                      {FEE_TYPES[t]}
                    </option>
                  ))}
                </Select>
              </FieldWrap>
              <FieldWrap label="Name" htmlFor="af-title" hint="Students see this on receipts.">
                <Input
                  id="af-title"
                  placeholder={defaultTitle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FieldWrap>
              <FieldWrap
                label={mode === 'class' ? 'Amount per student (₹)' : 'Amount (₹)'}
                htmlFor="af-amount"
                required
                error={
                  amount && !MONEY.test(amount)
                    ? 'Enter an amount like 45000 or 45000.50'
                    : undefined
                }
              >
                <Input
                  id="af-amount"
                  inputMode="decimal"
                  placeholder="45000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[,\s₹]/g, ''))}
                  className="font-semibold tabular-nums"
                />
              </FieldWrap>
              <FieldWrap
                label="Due by"
                htmlFor="af-due"
                hint="Optional. Fees past this date show as overdue."
              >
                <Input
                  id="af-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </FieldWrap>
              <div className="sm:col-span-2">
                <FieldWrap label="Note" htmlFor="af-notes" hint="Optional, only admins see it.">
                  <Input id="af-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </FieldWrap>
              </div>
            </div>
          </section>
        </div>

        <aside className="dt flex min-w-0 flex-[1_1_280px] flex-col gap-4 p-5">
          <h2 className="font-display text-heading text-[17px] font-semibold">Summary</h2>
          <dl className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Fee</dt>
              <dd className="text-heading text-right font-medium">{feeTitle}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{mode === 'class' ? 'Per student' : 'Amount'}</dt>
              <dd className="text-heading font-semibold tabular-nums">
                {MONEY.test(amount) ? inr(amount) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Bills</dt>
              <dd className="text-heading text-right">
                {mode === 'class'
                  ? classId
                    ? `${boarding === 'HOSTEL' ? 'Hostel students' : boarding === 'DAY_SCHOLAR' ? 'Day scholars' : 'Everyone'} in ${classes.nameOf(classId)}`
                    : '—'
                  : picked.data
                    ? fullName(picked.data)
                    : '—'}
              </dd>
            </div>
          </dl>
          {mode === 'class' && (
            <p className="text-muted text-[13px] leading-relaxed">
              Students who already have a fee with this name this year are skipped.
            </p>
          )}
          {problem && <p className="text-[13px] text-amber-700">{problem}</p>}
          <Btn busy={save.isPending} disabled={!!problem || !yearId} onClick={() => save.mutate()}>
            {mode === 'class' ? 'Bill the class' : 'Add fee'}
          </Btn>
        </aside>
      </div>
    </div>
  )
}
