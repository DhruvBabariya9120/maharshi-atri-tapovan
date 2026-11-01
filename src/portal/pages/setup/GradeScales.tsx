import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Plus, Trash2, X } from 'lucide-react'
import { Input } from '../../../components/ui/Field'
import { api, type Schemas } from '../../api/client'
import { Btn, ConfirmDialog, PageHeader, errorText } from '../../ui'

type Scale = Schemas['GradeScaleDto']
type Band = Schemas['GradeBandInputDto']
type Draft = { id: string | null; name: string; isDefault: boolean; bands: Band[] }

const TEMPLATE: Band[] = [
  { grade: 'A1', minPercent: 91, maxPercent: 100, isPass: true },
  { grade: 'A2', minPercent: 81, maxPercent: 90.99, isPass: true },
  { grade: 'B1', minPercent: 71, maxPercent: 80.99, isPass: true },
  { grade: 'B2', minPercent: 61, maxPercent: 70.99, isPass: true },
  { grade: 'C1', minPercent: 51, maxPercent: 60.99, isPass: true },
  { grade: 'C2', minPercent: 41, maxPercent: 50.99, isPass: true },
  { grade: 'D', minPercent: 33, maxPercent: 40.99, isPass: true },
  { grade: 'E', minPercent: 0, maxPercent: 32.99, isPass: false },
]

const r2 = (n: number) => Math.round(n * 100) / 100

/** Bands must cover 0-100% with no gaps or overlaps (percentages have 2 decimals). */
function checkBands(bands: Band[]) {
  const issues: string[] = []
  if (!bands.length) return ['Add at least one grade.']
  bands.forEach((b) => {
    if (!b.grade.trim()) issues.push('Every band needs a grade name.')
    if (b.minPercent < 0 || b.maxPercent > 100 || b.minPercent > b.maxPercent)
      issues.push(`${b.grade || 'A band'}: "From" must be 0–100 and not above "To".`)
  })
  const sorted = [...bands].sort((a, b) => a.minPercent - b.minPercent)
  if (sorted[0].minPercent > 0)
    issues.push(`0% to ${r2(sorted[0].minPercent - 0.01)}% has no grade.`)
  if (sorted.at(-1)!.maxPercent < 100)
    issues.push(`${r2(sorted.at(-1)!.maxPercent + 0.01)}% to 100% has no grade.`)
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    const expected = r2(prev.maxPercent + 0.01)
    if (cur.minPercent > expected)
      issues.push(
        `${expected}% to ${r2(cur.minPercent - 0.01)}% has no grade. Change ${prev.grade} or ${cur.grade}.`
      )
    else if (cur.minPercent <= prev.maxPercent)
      issues.push(`${prev.grade} and ${cur.grade} overlap.`)
  }
  return [...new Set(issues)]
}

const toDraft = (s: Scale): Draft => ({
  id: s.id,
  name: s.name,
  isDefault: s.isDefault,
  bands: s.bands.map(({ grade, minPercent, maxPercent, remark, isPass }) => ({
    grade,
    minPercent,
    maxPercent,
    remark: remark ?? undefined,
    isPass,
  })),
})

export function GradeScales() {
  const scales = useQuery({
    queryKey: ['grade-scales'],
    queryFn: () =>
      api<Schemas['PaginatedGradeScalesDto']>('/grade-scales', { query: { limit: 100 } }),
  })
  const items = scales.data?.items ?? []
  const [selected, setSelected] = useState<string | null>(null)
  const current =
    selected === 'new'
      ? null
      : (items.find((s) => s.id === selected) ?? items.find((s) => s.isDefault) ?? items[0])
  const draft: Draft | null =
    selected === 'new'
      ? { id: null, name: '', isDefault: !items.length, bands: TEMPLATE }
      : current
        ? toDraft(current)
        : null

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Setup"
        title="Grade scales"
        sub="Each exam uses one scale to turn percentages into grades."
      />
      <div className="flex flex-wrap items-start gap-5">
        <nav aria-label="Grade scales" className="flex w-full flex-col gap-2.5 sm:w-60">
          {scales.isPending && <div className="h-16 animate-pulse rounded-xl bg-slate-100" />}
          {scales.isError && (
            <p className="text-sm text-red-700">
              {errorText(scales.error, "Couldn't load grade scales.")}
            </p>
          )}
          {items.map((s) => {
            const on = s.id === draft?.id
            return (
              <button
                key={s.id}
                type="button"
                aria-current={on}
                onClick={() => setSelected(s.id)}
                className={`flex flex-col gap-0.5 rounded-xl border px-4 py-3.5 text-left ${on ? 'border-brand bg-tint-blue-soft' : 'border-border bg-card hover:border-blue-300'}`}
              >
                <span className="text-heading text-sm font-semibold">{s.name}</span>
                <span
                  className={`text-xs ${s.isDefault ? 'text-brand font-medium' : 'text-muted'}`}
                >
                  {s.isDefault ? 'Default · ' : ''}
                  {s.bands.length} grades
                </span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setSelected('new')}
            className={`text-brand flex min-h-11 items-center justify-center gap-2 rounded-full border border-dashed border-blue-300 text-[13px] font-semibold ${selected === 'new' ? 'bg-tint-blue' : 'bg-tint-blue-soft'}`}
          >
            <Plus className="h-4 w-4" aria-hidden /> New scale
          </button>
        </nav>
        <div className="min-w-0 flex-1 basis-140">
          {draft ? (
            // key: start fresh whenever another scale is picked
            <ScaleEditor key={draft.id ?? 'new'} initial={draft} onSaved={setSelected} />
          ) : (
            !scales.isPending && (
              <div className="dt text-muted p-8 text-center text-sm">
                No grade scales yet. Create one with "New scale".
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function ScaleEditor({
  initial,
  onSaved,
}: {
  initial: Draft
  onSaved: (id: string | null) => void
}) {
  const qc = useQueryClient()
  const [draft, setDraft] = useState(initial)
  const [deleting, setDeleting] = useState(false)
  const issues = checkBands(draft.bands)
  const refresh = () => qc.invalidateQueries({ queryKey: ['grade-scales'] })

  const setBand = (i: number, patch: Partial<Band>) =>
    setDraft((d) => ({ ...d, bands: d.bands.map((b, j) => (j === i ? { ...b, ...patch } : b)) }))

  const save = useMutation({
    mutationFn: () => {
      const body = { name: draft.name.trim(), isDefault: draft.isDefault, bands: draft.bands }
      return draft.id
        ? api<Scale>(`/grade-scales/${draft.id}`, { method: 'PATCH', body })
        : api<Scale>('/grade-scales', { method: 'POST', body })
    },
    onSuccess: (s) => {
      toast.success(`Saved ${s.name}`)
      refresh()
      onSaved(s.id)
    },
    onError: (err) => toast.error(errorText(err)),
  })
  const remove = useMutation({
    mutationFn: () => api(`/grade-scales/${draft.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Grade scale deleted')
      refresh()
      onSaved(null)
    },
    onError: (err) => {
      setDeleting(false)
      toast.error(errorText(err))
    },
  })

  // Coverage bar from 0% to 100%, lowest grade on the left; gaps show in amber.
  const segments: { label: string; width: number; gap?: boolean }[] = []
  let cursor = 0
  for (const b of [...draft.bands].sort((a, z) => a.minPercent - z.minPercent)) {
    if (b.minPercent > cursor + 0.011)
      segments.push({ label: '', width: b.minPercent - cursor, gap: true })
    segments.push({
      label: b.grade,
      width: Math.max(0, b.maxPercent - Math.max(b.minPercent, cursor)),
    })
    cursor = Math.max(cursor, b.maxPercent)
  }
  if (cursor < 99.99) segments.push({ label: '', width: 100 - cursor, gap: true })

  return (
    <section className="dt flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <label htmlFor="scale-name" className="text-heading text-sm font-medium">
            Scale name
          </label>
          <Input
            id="scale-name"
            maxLength={100}
            placeholder="GSEB standard"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-brand h-4.5 w-4.5"
            checked={draft.isDefault}
            onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))}
          />
          Default for new exams
        </label>
      </div>

      <div aria-label="Coverage from 0 to 100 percent" className="flex flex-col gap-1.5">
        <div className="flex h-7 overflow-hidden rounded-lg text-[11px] font-semibold">
          {segments.map((s, i) => (
            <div
              key={i}
              style={{ width: `${s.width}%` }}
              className={`grid place-items-center border-r border-white ${s.gap ? 'bg-amber-400' : i % 2 ? 'bg-blue-200 text-blue-900' : 'bg-blue-100 text-blue-900'}`}
            >
              {s.width > 4 ? s.label : ''}
            </div>
          ))}
        </div>
        <div className="text-muted flex justify-between text-[11px]">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {issues.length > 0 && (
        <div
          role="alert"
          className="flex gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-[13px] text-amber-800"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <ul className="flex flex-col gap-0.5">
            {issues.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Grade</th>
              <th>From %</th>
              <th>To %</th>
              <th>Remark</th>
              <th>Counts as</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {draft.bands.map((b, i) => {
              return (
                <tr key={i}>
                  <td className="w-24">
                    <Input
                      aria-label="Grade"
                      maxLength={5}
                      value={b.grade}
                      onChange={(e) => setBand(i, { grade: e.target.value })}
                      className="py-2 font-semibold"
                    />
                  </td>
                  <td className="w-28">
                    <Input
                      aria-label={`${b.grade} from percent`}
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={b.minPercent}
                      onChange={(e) => setBand(i, { minPercent: Number(e.target.value) })}
                      className="py-2 text-right tabular-nums"
                    />
                  </td>
                  <td className="w-28">
                    <Input
                      aria-label={`${b.grade} to percent`}
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={b.maxPercent}
                      onChange={(e) => setBand(i, { maxPercent: Number(e.target.value) })}
                      className="py-2 text-right tabular-nums"
                    />
                  </td>
                  <td>
                    <Input
                      aria-label={`${b.grade} remark`}
                      maxLength={100}
                      placeholder="Optional"
                      value={b.remark ?? ''}
                      onChange={(e) => setBand(i, { remark: e.target.value })}
                      className="py-2"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setBand(i, { isPass: !(b.isPass ?? true) })}
                      className={`min-h-9 rounded-full px-3 text-xs font-semibold ${(b.isPass ?? true) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {(b.isPass ?? true) ? 'Pass' : 'Fail'}
                    </button>
                  </td>
                  <td>
                    <div className="ra">
                      <button
                        type="button"
                        className="danger"
                        aria-label={`Remove grade ${b.grade}`}
                        onClick={() =>
                          setDraft((d) => ({ ...d, bands: d.bands.filter((_, j) => j !== i) }))
                        }
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex gap-2.5">
          <Btn
            variant="outline"
            onClick={() =>
              setDraft((d) => ({
                ...d,
                bands: [...d.bands, { grade: '', minPercent: 0, maxPercent: 0, isPass: true }],
              }))
            }
          >
            <Plus className="h-4 w-4" aria-hidden /> Add grade
          </Btn>
          {draft.id && (
            <Btn
              variant="outline"
              disabled={draft.isDefault}
              title={draft.isDefault ? 'Pick another default first' : undefined}
              onClick={() => setDeleting(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Delete scale
            </Btn>
          )}
        </div>
        <Btn
          busy={save.isPending}
          disabled={issues.length > 0 || !draft.name.trim()}
          onClick={() => save.mutate()}
        >
          Save scale
        </Btn>
      </div>

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title={`Delete ${draft.name}?`}
        body="Exams that already use this scale keep their published grades."
        confirmLabel="Delete scale"
        busy={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </section>
  )
}
