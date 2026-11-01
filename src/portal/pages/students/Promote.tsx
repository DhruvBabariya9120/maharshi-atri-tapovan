import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import { Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { useClasses, useYears } from '../../api/lookups'
import { Btn, PageHeader, TableState, errorText } from '../../ui'
import { StudentAvatar, fullName } from './common'

type Rolls = Schemas['PromoteStudentsDto']['rollNumbers']

export function Promote() {
  const qc = useQueryClient()
  const years = useYears()
  const sortedYears = [...years.items].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const currentIdx = sortedYears.findIndex((y) => y.id === years.current?.id)

  // Default: last year's class → this year's next class.
  const [fromYearPick, setFromYear] = useState('')
  const [toYearPick, setToYear] = useState('')
  const fromYear = fromYearPick || sortedYears[currentIdx - 1]?.id || years.current?.id || ''
  const toYear = toYearPick || years.current?.id || ''
  const fromClasses = useClasses(fromYear)
  const toClasses = useClasses(toYear)
  const [fromClass, setFromClass] = useState('')
  const [toClass, setToClass] = useState('')
  const [rolls, setRolls] = useState<Rolls>('KEEP')
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

  const students = useQuery({
    queryKey: ['students', 'promote', fromYear, fromClass],
    queryFn: () =>
      api<Schemas['PaginatedStudentsDto']>('/students', {
        query: {
          academicYearId: fromYear,
          classId: fromClass,
          status: 'ACTIVE',
          sort: 'name',
          limit: 100,
        },
      }),
    enabled: !!fromClass,
  })
  const items = students.data?.items ?? []
  const moving = items.filter((s) => !skipped.has(s.id))

  const promote = useMutation({
    mutationFn: () =>
      api<Schemas['PromoteResultDto']>('/enrollments/promote', {
        method: 'POST',
        body: {
          fromClassId: fromClass,
          toClassId: toClass,
          studentIds: moving.map((s) => s.id),
          rollNumbers: rolls,
        },
      }),
    onSuccess: (r) => {
      toast.success(
        `Promoted ${r.items.length} ${r.items.length === 1 ? 'student' : 'students'} to ${toClasses.nameOf(toClass)}`
      )
      setSkipped(new Set())
      qc.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (err) => toast.error(errorText(err)),
  })

  const problem = !fromClass
    ? 'Pick the class to promote from.'
    : !toClass
      ? 'Pick the class they move to.'
      : fromClass === toClass
        ? 'Pick a different class to move to.'
        : !moving.length
          ? 'Select at least one student.'
          : null

  const yearSelect = (id: string, value: string, onChange: (v: string) => void) => (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {sortedYears.map((y) => (
        <option key={y.id} value={y.id}>
          {y.name}
        </option>
      ))}
    </Select>
  )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Promote to next year"
        sub="Enroll a class into its next standard. Students you untick stay where they are."
      />

      <section className="dt grid items-end gap-4 p-5 lg:grid-cols-[1fr_1fr_auto_1fr_1fr_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from-year" className="text-heading text-[13px] font-medium">
            From year
          </label>
          {yearSelect('from-year', fromYear, (v) => {
            setFromYear(v)
            setFromClass('')
          })}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from-class" className="text-heading text-[13px] font-medium">
            From class
          </label>
          <Select
            id="from-class"
            value={fromClass}
            onChange={(e) => {
              setFromClass(e.target.value)
              setSkipped(new Set())
            }}
          >
            <option value="">Choose…</option>
            {fromClasses.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.standard}
              </option>
            ))}
          </Select>
        </div>
        <ArrowRight className="text-brand mx-auto mb-3 hidden h-5 w-5 lg:block" aria-hidden />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="to-year" className="text-heading text-[13px] font-medium">
            To year
          </label>
          {yearSelect('to-year', toYear, (v) => {
            setToYear(v)
            setToClass('')
          })}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="to-class" className="text-heading text-[13px] font-medium">
            To class
          </label>
          <Select id="to-class" value={toClass} onChange={(e) => setToClass(e.target.value)}>
            <option value="">Choose…</option>
            {toClasses.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.standard}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rolls" className="text-heading text-[13px] font-medium">
            Roll numbers
          </label>
          <Select id="rolls" value={rolls} onChange={(e) => setRolls(e.target.value as Rolls)}>
            <option value="KEEP">Keep current order</option>
            <option value="ALPHABETICAL">Re-number A to Z</option>
          </Select>
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-5">
        <section className="dt min-w-0 flex-[3_1_520px]">
          <div className="dt-bar">
            <h2 className="dt-title">
              {fromClass
                ? `${fromClasses.nameOf(fromClass)} · ${years.nameOf(fromYear)}`
                : 'Students'}
              <span className="dt-count">{items.length}</span>
            </h2>
            {items.length > 0 && (
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="accent-brand h-4.5 w-4.5"
                  checked={!skipped.size}
                  onChange={() =>
                    setSkipped(skipped.size ? new Set() : new Set(items.map((s) => s.id)))
                  }
                />
                Select all
              </label>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="w-11" />
                  <th>Student</th>
                  <th>Moves to</th>
                </tr>
              </thead>
              <tbody>
                <TableState
                  cols={3}
                  loading={!!fromClass && students.isPending}
                  error={students.error}
                  empty={!items.length}
                  emptyText={
                    fromClass
                      ? 'No active students in this class.'
                      : 'Pick a class above to see its students.'
                  }
                  onRetry={() => students.refetch()}
                />
                {items.map((s) => {
                  const stays = skipped.has(s.id)
                  return (
                    <tr key={s.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="accent-brand h-4.5 w-4.5 align-middle"
                          aria-label={`Promote ${fullName(s)}`}
                          checked={!stays}
                          onChange={() =>
                            setSkipped((cur) => {
                              const n = new Set(cur)
                              if (n.has(s.id)) n.delete(s.id)
                              else n.add(s.id)
                              return n
                            })
                          }
                        />
                      </td>
                      <td>
                        <span className="flex items-center gap-3">
                          <StudentAvatar student={s} size={32} />
                          <span className="flex flex-col">
                            <b className="text-heading font-semibold">{fullName(s)}</b>
                            <small className="text-muted font-mono text-xs">{s.admissionNo}</small>
                          </span>
                        </span>
                      </td>
                      <td
                        className={
                          stays ? 'text-accent-ink font-medium' : 'text-heading font-medium'
                        }
                      >
                        {stays
                          ? `Stays in ${fromClasses.nameOf(fromClass)}`
                          : toClass
                            ? toClasses.nameOf(toClass)
                            : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="dt flex min-w-0 flex-[1_1_280px] flex-col gap-4 p-5">
          <h2 className="font-display text-heading text-[17px] font-semibold">Summary</h2>
          <dl className="flex flex-col gap-2.5 text-sm tabular-nums">
            <div className="flex justify-between">
              <dt>Move to {toClass ? toClasses.nameOf(toClass) : 'new class'}</dt>
              <dd className="text-heading font-semibold">{moving.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Stay behind</dt>
              <dd className="text-accent-ink font-semibold">{skipped.size}</dd>
            </div>
          </dl>
          <p className="text-muted text-[13px] leading-relaxed">
            Old enrollments stay as history. Fees for the new year aren't created here. Assign them
            after promotion.
          </p>
          {problem && <p className="text-[13px] text-amber-700">{problem}</p>}
          <Btn busy={promote.isPending} disabled={!!problem} onClick={() => promote.mutate()}>
            Promote {moving.length || ''} {moving.length === 1 ? 'student' : 'students'}
          </Btn>
        </aside>
      </div>
    </div>
  )
}
