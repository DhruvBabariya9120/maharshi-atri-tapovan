import { useQuery } from '@tanstack/react-query'
import { api, type Schemas } from './client'

/** Small reference lists used across screens (pickers, labels). */

export const yearsQuery = {
  queryKey: ['academic-years'],
  queryFn: () =>
    api<Schemas['PaginatedAcademicYearsDto']>('/academic-years', { query: { limit: 100 } }),
}

export function useYears() {
  const q = useQuery(yearsQuery)
  const items = q.data?.items ?? []
  return {
    ...q,
    items,
    current: items.find((y) => y.isCurrent) ?? items[0],
    nameOf: (id: string) => items.find((y) => y.id === id)?.name ?? '—',
  }
}

/** Classes for one year, sorted Std 4 → Std 10. Pass no year to get every class. */
export function useClasses(academicYearId?: string) {
  const q = useQuery({
    queryKey: ['classes', academicYearId ?? 'all'],
    queryFn: () =>
      api<Schemas['PaginatedClassesDto']>('/classes', { query: { academicYearId, limit: 100 } }),
  })
  const items = [...(q.data?.items ?? [])].sort((a, b) =>
    a.standard.localeCompare(b.standard, undefined, { numeric: true, sensitivity: 'base' })
  )
  return { ...q, items, nameOf: (id: string) => items.find((c) => c.id === id)?.standard ?? '—' }
}

type Purpose = Schemas['PresignUploadDto']['purpose']

const LIMITS: Record<Purpose, { mb: number; types: string[] }> = {
  STUDENT_DOCUMENT: { mb: 10, types: ['application/pdf', 'image/jpeg', 'image/png'] },
  STUDENT_PHOTO: { mb: 2, types: ['image/jpeg', 'image/png', 'image/webp'] },
  PAYMENT_QR: { mb: 2, types: ['image/jpeg', 'image/png', 'image/webp'] },
  PAYMENT_SCREENSHOT: { mb: 5, types: ['image/jpeg', 'image/png', 'image/webp'] },
}

/** Same limits the API enforces, checked first so the user hears about it straight away. */
export function checkFile(file: File, purpose: Purpose): string | null {
  const { mb, types } = LIMITS[purpose]
  if (!types.includes(file.type)) {
    const names = types.map((t) => t.split('/')[1].toUpperCase().replace('JPEG', 'JPG'))
    return `${file.name} wasn't uploaded. Use ${names.join(', ')}.`
  }
  if (file.size > mb * 1024 * 1024) return `${file.name} is larger than ${mb} MB.`
  return null
}

/** Presign, upload straight to storage, and return the key for the owning endpoint. */
export async function uploadFile(file: File, purpose: Purpose, studentId?: string) {
  const p = await api<Schemas['PresignedUploadDto']>('/uploads/presign', {
    method: 'POST',
    body: { purpose, contentType: file.type, sizeBytes: file.size, studentId },
  })
  const res = await fetch(p.uploadUrl, {
    method: 'PUT',
    headers: p.headers as Record<string, string>,
    body: file,
  })
  if (!res.ok) throw new Error(`Upload failed (${res.status}). Try again.`)
  return p.key
}
