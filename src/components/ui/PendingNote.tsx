import { Info } from 'lucide-react'

/** Marks content the school must still supply. Clearly non-final. */
export function PendingNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 inline-flex items-start gap-2 rounded-lg bg-tint-pink/60 px-3 py-2 text-xs font-medium text-accent-strong">
      <Info className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
