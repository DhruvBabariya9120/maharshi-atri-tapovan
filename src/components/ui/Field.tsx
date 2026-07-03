import { forwardRef } from 'react'
import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'

const control =
  'w-full rounded-xl border bg-body px-4 py-3 text-sm text-heading placeholder:text-muted transition-colors duration-200 focus:border-brand focus:outline-none'

function fieldBorder(error?: string) {
  return error ? 'border-red-400 focus:border-red-500' : 'border-border'
}

export function FieldWrap({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-heading">
        {label}
        {required && <span className="ml-0.5 text-accent-strong">*</span>}
      </label>
      {children}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && (
        <span className="flex items-center gap-1 text-xs font-medium text-red-500" role="alert">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </span>
      )}
    </div>
  )
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(({ error, className = '', ...props }, ref) => (
  <input ref={ref} className={`${control} ${fieldBorder(error)} ${className}`} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ error, className = '', ...props }, ref) => (
  <textarea ref={ref} className={`${control} ${fieldBorder(error)} ${className}`} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { error?: string; children: ReactNode }
>(({ error, className = '', children, ...props }, ref) => (
  <select ref={ref} className={`${control} ${fieldBorder(error)} ${className}`} {...props}>
    {children}
  </select>
))
Select.displayName = 'Select'
