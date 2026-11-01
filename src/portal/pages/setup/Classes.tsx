import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { Input, Select } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { Btn, ConfirmDialog, Dialog, PageHeader, TableState, errorText } from '../../ui'
import { yearsQuery } from '../../api/lookups'

type Klass = Schemas['ClassDto']

// "Std 10" after "Std 9": compare the numbers inside, then the text.
const byStandard = (a: Klass, b: Klass) =>
  a.standard.localeCompare(b.standard, undefined, { numeric: true, sensitivity: 'base' })

export function Classes() {
  const qc = useQueryClient()
  const years = useQuery(yearsQuery)
  const allYears = years.data?.items ?? []
  const [picked, setPicked] = useState('')
  const yearId = picked || allYears.find((y) => y.isCurrent)?.id || allYears[0]?.id || ''
  const year = allYears.find((y) => y.id === yearId)

  const classes = useQuery({
    queryKey: ['classes', yearId],
    queryFn: () =>
      api<Schemas['PaginatedClassesDto']>('/classes', {
        query: { academicYearId: yearId, limit: 100 },
      }),
    enabled: !!yearId,
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['classes', yearId] })

  const [newStandard, setNewStandard] = useState('')
  const [renaming, setRenaming] = useState<Klass | null>(null)
  const [renameTo, setRenameTo] = useState('')
  const [deleting, setDeleting] = useState<Klass | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyFrom, setCopyFrom] = useState('')

  const create = useMutation({
    mutationFn: (standard: string) =>
      api<Schemas['ClassesResultDto']>('/classes', {
        method: 'POST',
        body: { items: [{ academicYearId: yearId, standard }] },
      }),
    onSuccess: () => {
      toast.success(`Added ${newStandard.trim()}`)
      setNewStandard('')
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const rename = useMutation({
    mutationFn: ({ id, standard }: { id: string; standard: string }) =>
      api<Klass>(`/classes/${id}`, { method: 'PATCH', body: { standard } }),
    onSuccess: () => {
      toast.success('Class renamed')
      setRenaming(null)
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api(`/classes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Class deleted')
      setDeleting(null)
      refresh()
    },
    onError: (err) => {
      setDeleting(null)
      toast.error(errorText(err, "This class has students enrolled and can't be deleted."))
    },
  })
  const copy = useMutation({
    mutationFn: () =>
      api<Schemas['CopyClassesResultDto']>('/classes/copy', {
        method: 'POST',
        body: { fromAcademicYearId: copyFrom, toAcademicYearId: yearId },
      }),
    onSuccess: (r) => {
      toast.success(
        `Copied ${r.created} ${r.created === 1 ? 'class' : 'classes'}` +
          (r.skipped ? `, skipped ${r.skipped} that already existed` : '')
      )
      setCopyOpen(false)
      refresh()
    },
    onError: (err) => toast.error(errorText(err)),
  })

  const items = [...(classes.data?.items ?? [])].sort(byStandard)
  const otherYears = allYears.filter((y) => y.id !== yearId)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Setup"
        title="Classes"
        sub="One class per standard for each academic year."
        actions={
          <>
            <Select
              aria-label="Academic year"
              value={yearId}
              onChange={(e) => setPicked(e.target.value)}
              className="min-h-11 w-auto py-2"
            >
              {allYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.isCurrent ? ' (current)' : ''}
                </option>
              ))}
            </Select>
            <Btn
              variant="outline"
              disabled={!otherYears.length}
              onClick={() => {
                setCopyFrom(otherYears[0]?.id ?? '')
                setCopyOpen(true)
              }}
            >
              <Copy className="h-4 w-4" aria-hidden />
              Copy from another year
            </Btn>
          </>
        }
      />

      {!years.isPending && !allYears.length ? (
        <div className="dt text-muted p-8 text-center text-sm">
          Add an academic year first, then come back to set up its classes.
        </div>
      ) : (
        <section className="dt">
          <div className="dt-bar">
            <h2 className="dt-title">
              {year?.name ?? 'Classes'} <span className="dt-count">{items.length}</span>
            </h2>
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (newStandard.trim()) create.mutate(newStandard.trim())
              }}
            >
              <Input
                aria-label="New standard"
                placeholder="e.g. Std 11"
                maxLength={20}
                value={newStandard}
                onChange={(e) => setNewStandard(e.target.value)}
                className="min-h-11 w-44 py-2"
              />
              <Btn type="submit" busy={create.isPending} disabled={!newStandard.trim()}>
                Add class
              </Btn>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Standard</th>
                  <th className="text-right!">Actions</th>
                </tr>
              </thead>
              <tbody>
                <TableState
                  cols={2}
                  loading={years.isPending || classes.isPending}
                  error={years.error ?? classes.error}
                  empty={!items.length}
                  emptyText={`No classes in ${year?.name ?? 'this year'} yet. Add one, or copy them from another year.`}
                  onRetry={() => classes.refetch()}
                />
                {items.map((c) => (
                  <tr key={c.id}>
                    <td className="text-heading font-semibold">{c.standard}</td>
                    <td>
                      <div className="ra">
                        <button
                          type="button"
                          aria-label={`Rename ${c.standard}`}
                          title="Rename"
                          onClick={() => {
                            setRenameTo(c.standard)
                            setRenaming(c)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="danger"
                          aria-label={`Delete ${c.standard}`}
                          title="Delete"
                          onClick={() => setDeleting(c)}
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
      )}
      <p className="text-muted text-[13px]">
        A class with students enrolled can't be deleted. Rename it instead.
      </p>

      <Dialog
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title={`Rename ${renaming?.standard ?? ''}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setRenaming(null)}>
              Cancel
            </Btn>
            <Btn
              busy={rename.isPending}
              disabled={!renameTo.trim()}
              onClick={() =>
                renaming && rename.mutate({ id: renaming.id, standard: renameTo.trim() })
              }
            >
              Save
            </Btn>
          </>
        }
      >
        <label htmlFor="rename" className="text-heading text-sm font-medium">
          Standard
        </label>
        <Input
          id="rename"
          maxLength={20}
          value={renameTo}
          onChange={(e) => setRenameTo(e.target.value)}
        />
      </Dialog>

      <Dialog
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        title={`Copy classes into ${year?.name ?? ''}`}
        footer={
          <>
            <Btn variant="outline" onClick={() => setCopyOpen(false)}>
              Cancel
            </Btn>
            <Btn busy={copy.isPending} disabled={!copyFrom} onClick={() => copy.mutate()}>
              Copy classes
            </Btn>
          </>
        }
      >
        <p>
          Creates the same standards in {year?.name}. Standards that already exist there are
          skipped.
        </p>
        <label htmlFor="copy-from" className="text-heading text-sm font-medium">
          Copy from
        </label>
        <Select id="copy-from" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
          {otherYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </Select>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.standard ?? ''}?`}
        body={`This removes ${deleting?.standard} from ${year?.name}. Classes with students can't be deleted.`}
        confirmLabel="Delete class"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  )
}
