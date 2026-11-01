import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Power, Search, Trash2 } from 'lucide-react'
import { FieldWrap, Input, Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { Btn, ConfirmDialog, Dialog, PageHeader, Pill, TableState, errorText } from '../../ui'

type Subject = Schemas['SubjectDto']

const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Enter the subject name').max(100),
  code: z
    .string()
    .trim()
    .min(1, 'Enter a short code, e.g. MAT')
    .max(20)
    .transform((s) => s.toUpperCase()),
})
type SubjectForm = z.input<typeof subjectSchema>

export function Subjects() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [active, setActive] = useState<'' | 'true' | 'false'>('')
  const subjects = useQuery({
    queryKey: ['subjects', q, active],
    queryFn: () =>
      api<Schemas['PaginatedSubjectsDto']>('/subjects', {
        query: { q, isActive: active || undefined, limit: 100 },
      }),
    placeholderData: keepPreviousData,
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['subjects'] })

  const addForm = useForm<SubjectForm>({ resolver: zodResolver(subjectSchema) })
  const editForm = useForm<SubjectForm>({ resolver: zodResolver(subjectSchema) })
  const [editing, setEditing] = useState<Subject | null>(null)
  const [deleting, setDeleting] = useState<Subject | null>(null)

  const create = useMutation({
    mutationFn: (item: SubjectForm) =>
      api<Schemas['SubjectsResultDto']>('/subjects', { method: 'POST', body: { items: [item] } }),
    onSuccess: (_, item) => {
      toast.success(`Added ${item.name}`)
      addForm.reset({ name: '', code: '' })
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Schemas['UpdateSubjectDto'] }) =>
      api<Subject>(`/subjects/${id}`, { method: 'PATCH', body }),
    onSuccess: (s, { body }) => {
      toast.success(
        body.isActive === undefined
          ? `Saved ${s.name}`
          : `${s.name} is now ${s.isActive ? 'active' : 'inactive'}`
      )
      setEditing(null)
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api(`/subjects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Subject deleted')
      setDeleting(null)
      refresh()
    },
    onError: (err) => {
      setDeleting(null)
      toast.error(errorText(err, 'This subject is used in exams. Make it inactive instead.'))
    },
  })

  const items = subjects.data?.items ?? []
  const ae = addForm.formState.errors
  const ee = editForm.formState.errors

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Setup"
        title="Subjects"
        sub="Exams pick their papers from this list. Inactive subjects are hidden from new exams but stay on old results."
      />

      <form
        onSubmit={addForm.handleSubmit((v) => create.mutate(subjectSchema.parse(v)))}
        noValidate
        className="dt grid items-start gap-4 p-5 sm:grid-cols-[2fr_1fr_auto]"
      >
        <FieldWrap label="Subject name" htmlFor="add-name" error={ae.name?.message}>
          <Input
            id="add-name"
            placeholder="Computer"
            error={ae.name?.message}
            {...addForm.register('name')}
          />
        </FieldWrap>
        <FieldWrap label="Code" htmlFor="add-code" error={ae.code?.message}>
          <Input
            id="add-code"
            placeholder="CMP"
            className="uppercase"
            error={ae.code?.message}
            {...addForm.register('code')}
          />
        </FieldWrap>
        <Btn type="submit" busy={create.isPending} className="sm:mt-6.5">
          Add subject
        </Btn>
      </form>

      <section className="dt">
        <div className="dt-bar">
          <h2 className="dt-title">
            Subjects <span className="dt-count">{subjects.data?.total ?? 0}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <label className="border-border text-muted flex min-h-11 items-center gap-2 rounded-xl border bg-slate-50 px-3 text-sm">
              <Search className="h-4 w-4" aria-hidden />
              <input
                aria-label="Search subjects"
                placeholder="Name or code"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="text-heading w-40 bg-transparent outline-none"
              />
            </label>
            <Select
              aria-label="Status"
              value={active}
              onChange={(e) => setActive(e.target.value as typeof active)}
              className="min-h-11 w-auto py-2"
            >
              <option value="">Active and inactive</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Code</th>
                <th>Status</th>
                <th className="text-right!">Actions</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                cols={4}
                loading={subjects.isPending}
                error={subjects.error}
                empty={!items.length}
                emptyText={
                  q || active
                    ? 'No subjects match these filters.'
                    : 'No subjects yet. Add the first one above.'
                }
                onRetry={() => subjects.refetch()}
              />
              {items.map((s) => (
                <tr key={s.id}>
                  <td className={`font-medium ${s.isActive ? 'text-heading' : 'text-muted'}`}>
                    {s.name}
                  </td>
                  <td className="font-mono text-[13px]">{s.code}</td>
                  <td>
                    {s.isActive ? (
                      <Pill tone="green">Active</Pill>
                    ) : (
                      <Pill tone="slate">Inactive</Pill>
                    )}
                  </td>
                  <td>
                    <div className="ra">
                      <button
                        type="button"
                        aria-label={`${s.isActive ? 'Make inactive' : 'Make active'}: ${s.name}`}
                        title={s.isActive ? 'Make inactive' : 'Make active'}
                        disabled={update.isPending}
                        onClick={() => update.mutate({ id: s.id, body: { isActive: !s.isActive } })}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${s.name}`}
                        title="Edit"
                        onClick={() => {
                          editForm.reset({ name: s.name, code: s.code })
                          setEditing(s)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="danger"
                        aria-label={`Delete ${s.name}`}
                        title="Delete"
                        onClick={() => setDeleting(s)}
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
                (v) => editing && update.mutate({ id: editing.id, body: subjectSchema.parse(v) })
              )}
            >
              Save
            </Btn>
          </>
        }
      >
        <FieldWrap label="Subject name" htmlFor="edit-name" error={ee.name?.message}>
          <Input id="edit-name" error={ee.name?.message} {...editForm.register('name')} />
        </FieldWrap>
        <FieldWrap label="Code" htmlFor="edit-code" error={ee.code?.message}>
          <Input
            id="edit-code"
            className="uppercase"
            error={ee.code?.message}
            {...editForm.register('code')}
          />
        </FieldWrap>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? ''}?`}
        body="Subjects already used in an exam can't be deleted. Make them inactive instead, so old results keep their marks."
        confirmLabel="Delete subject"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  )
}
