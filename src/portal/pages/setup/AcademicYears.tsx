import { useState } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarCheck, Pencil, Trash2 } from 'lucide-react'
import { FieldWrap, Input } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { yearsQuery } from '../../api/lookups'
import {
  Btn,
  ConfirmDialog,
  Dialog,
  PageHeader,
  Pill,
  TableState,
  errorText,
  fmtDate,
} from '../../ui'

type Year = Schemas['AcademicYearDto']

const yearSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a name like 2027-28').max(50),
    startDate: z.string().min(1, 'Pick a start date'),
    endDate: z.string().min(1, 'Pick an end date'),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate > v.startDate, {
    path: ['endDate'],
    message: 'End date must be after the start date',
  })
type YearForm = z.infer<typeof yearSchema>

function status(y: Year) {
  if (y.isCurrent) return <Pill tone="blue">Current</Pill>
  const today = new Date().toISOString().slice(0, 10)
  if (y.startDate.slice(0, 10) > today) return <Pill tone="amber">Upcoming</Pill>
  return <Pill tone="slate">Past</Pill>
}

function YearFields({ form, idPrefix }: { form: UseFormReturn<YearForm>; idPrefix: string }) {
  const e = form.formState.errors
  return (
    <>
      <FieldWrap label="Name" htmlFor={`${idPrefix}-name`} error={e.name?.message}>
        <Input
          id={`${idPrefix}-name`}
          placeholder="2027-28"
          error={e.name?.message}
          {...form.register('name')}
        />
      </FieldWrap>
      <FieldWrap label="Starts" htmlFor={`${idPrefix}-start`} error={e.startDate?.message}>
        <Input
          id={`${idPrefix}-start`}
          type="date"
          error={e.startDate?.message}
          {...form.register('startDate')}
        />
      </FieldWrap>
      <FieldWrap label="Ends" htmlFor={`${idPrefix}-end`} error={e.endDate?.message}>
        <Input
          id={`${idPrefix}-end`}
          type="date"
          error={e.endDate?.message}
          {...form.register('endDate')}
        />
      </FieldWrap>
    </>
  )
}

export function AcademicYears() {
  const qc = useQueryClient()
  const years = useQuery(yearsQuery)
  const [editing, setEditing] = useState<Year | null>(null)
  const [deleting, setDeleting] = useState<Year | null>(null)
  const refresh = () => qc.invalidateQueries({ queryKey: ['academic-years'] })

  const addForm = useForm<YearForm>({ resolver: zodResolver(yearSchema) })
  const editForm = useForm<YearForm>({ resolver: zodResolver(yearSchema) })

  const create = useMutation({
    mutationFn: (body: YearForm) => api<Year>('/academic-years', { method: 'POST', body }),
    onSuccess: (y) => {
      toast.success(`Added ${y.name}. Set up its classes next.`)
      addForm.reset({ name: '', startDate: '', endDate: '' })
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: YearForm }) =>
      api<Year>(`/academic-years/${id}`, { method: 'PATCH', body }),
    onSuccess: (y) => {
      toast.success(`Saved ${y.name}`)
      setEditing(null)
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const setCurrent = useMutation({
    mutationFn: (id: string) => api<Year>(`/academic-years/${id}/set-current`, { method: 'POST' }),
    onSuccess: (y) => {
      toast.success(`${y.name} is now the current year`)
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api(`/academic-years/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Year deleted')
      setDeleting(null)
      refresh()
    },
    onError: (err) => {
      setDeleting(null)
      toast.error(errorText(err, "This year is in use and can't be deleted."))
    },
  })

  const items = [...(years.data?.items ?? [])].sort((a, b) =>
    b.startDate.localeCompare(a.startDate)
  )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Setup"
        title="Academic years"
        sub="The current year is what fees, classes and exams use by default. Only one year can be current."
      />

      <form
        onSubmit={addForm.handleSubmit((v) => create.mutate(v))}
        noValidate
        className="dt grid items-start gap-4 p-5 sm:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <YearFields form={addForm} idPrefix="add" />
        <Btn type="submit" busy={create.isPending} className="sm:mt-6.5">
          Add year
        </Btn>
      </form>

      <section className="dt">
        <div className="dt-bar">
          <h2 className="dt-title">
            Years <span className="dt-count">{years.data?.total ?? 0}</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Year</th>
                <th>Dates</th>
                <th>Status</th>
                <th className="text-right!">Actions</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                cols={4}
                loading={years.isPending}
                error={years.error}
                empty={!items.length}
                emptyText="No academic years yet. Add the first one above."
                onRetry={() => years.refetch()}
              />
              {items.map((y) => (
                <tr key={y.id}>
                  <td className="text-heading font-semibold">{y.name}</td>
                  <td className="whitespace-nowrap">
                    {fmtDate(y.startDate)} – {fmtDate(y.endDate)}
                  </td>
                  <td>{status(y)}</td>
                  <td>
                    <div className="ra">
                      {!y.isCurrent && (
                        <button
                          type="button"
                          aria-label={`Set ${y.name} as current`}
                          title="Set as current"
                          disabled={setCurrent.isPending}
                          onClick={() => setCurrent.mutate(y.id)}
                        >
                          <CalendarCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Edit ${y.name}`}
                        title="Edit"
                        onClick={() => {
                          editForm.reset({
                            name: y.name,
                            startDate: y.startDate.slice(0, 10),
                            endDate: y.endDate.slice(0, 10),
                          })
                          setEditing(y)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="danger"
                        aria-label={`Delete ${y.name}`}
                        title={y.isCurrent ? "The current year can't be deleted" : 'Delete'}
                        disabled={y.isCurrent}
                        onClick={() => setDeleting(y)}
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
        After adding a year, set up its classes with "Copy from another year" on the Classes page.
      </p>

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.name ?? ''}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
            <Btn
              busy={update.isPending}
              onClick={editForm.handleSubmit(
                (body) => editing && update.mutate({ id: editing.id, body })
              )}
            >
              Save
            </Btn>
          </>
        }
      >
        <YearFields form={editForm} idPrefix="edit" />
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? ''}?`}
        body="A year that already has classes, students or fees can't be deleted."
        confirmLabel="Delete year"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  )
}
