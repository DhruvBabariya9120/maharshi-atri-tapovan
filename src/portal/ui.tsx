import { useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { ApiError } from './api/client'

/** Turn any thrown error into a sentence for a toast or notice. */
// eslint-disable-next-line react-refresh/only-export-components
export function errorText(err: unknown, fallback = 'Something went wrong. Try again.') {
  if (err instanceof ApiError) {
    if (err.status >= 500) return 'The server had a problem. Try again in a minute.'
    return err.message || fallback
  }
  return fallback
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string
  title: string
  sub?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <span className="text-accent-ink text-xs font-semibold tracking-[0.08em] uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-heading text-[28px] font-semibold">{title}</h1>
        {sub && <p className="text-muted text-sm">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

const btn = {
  primary:
    'bg-brand text-white shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)] hover:bg-brand-dark border border-transparent',
  outline: 'border border-border bg-card text-heading hover:border-brand hover:text-brand',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-transparent',
}

export function Btn({
  variant = 'primary',
  busy,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof btn; busy?: boolean }) {
  return (
    <button
      type={type}
      disabled={busy || rest.disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 ${btn[variant]} ${className}`}
      {...rest}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

const tones = {
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-tint-blue text-brand',
  slate: 'bg-slate-100 text-slate-600',
  pink: 'bg-tint-pink text-accent-ink',
}

export function Pill({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${tones[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  )
}

/** Loading, error and empty rows for a table body. Renders nothing when there's data. */
export function TableState({
  cols,
  loading,
  error,
  empty,
  emptyText,
  onRetry,
}: {
  cols: number
  loading: boolean
  error: unknown
  empty: boolean
  emptyText: ReactNode
  onRetry?: () => void
}) {
  if (loading)
    return (
      <>
        {[0, 1, 2].map((i) => (
          <tr key={i}>
            <td colSpan={cols}>
              <div className="h-5 animate-pulse rounded-md bg-slate-100" />
            </td>
          </tr>
        ))}
      </>
    )
  if (error)
    return (
      <tr>
        <td colSpan={cols}>
          <div className="flex flex-wrap items-center gap-3 py-6 text-sm text-red-700">
            <AlertCircle className="h-5 w-5" aria-hidden />
            {errorText(error, "Couldn't load this list.")}
            {onRetry && (
              <button type="button" onClick={onRetry} className="text-brand font-medium">
                Try again
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  if (empty)
    return (
      <tr>
        <td colSpan={cols}>
          <div className="text-muted flex flex-col items-center gap-2 py-10 text-center text-sm">
            <Inbox className="h-7 w-7 text-slate-300" aria-hidden />
            {emptyText}
          </div>
        </td>
      </tr>
    )
  return null
}

/** Modal built on the native <dialog>: focus trap, Esc to close and backdrop for free. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={ref} className="pdlg" onClose={onClose} aria-labelledby="pdlg-title">
      {open && (
        <div className="flex flex-col gap-4 p-6">
          <h2 id="pdlg-title" className="font-display text-heading text-xl font-semibold">
            {title}
          </h2>
          <div className="text-content flex flex-col gap-4 text-sm leading-relaxed">{children}</div>
          <div className="flex flex-wrap justify-end gap-2.5 pt-1">{footer}</div>
        </div>
      )}
    </dialog>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  body: ReactNode
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="danger" busy={busy} onClick={onConfirm}>
            {confirmLabel}
          </Btn>
        </>
      }
    >
      {body}
    </Dialog>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
