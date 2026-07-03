import type { ReactNode } from 'react'

type Tone = 'brand' | 'accent' | 'neutral'

const tones: Record<Tone, string> = {
  brand: 'bg-tint-blue text-brand',
  accent: 'bg-tint-pink text-accent-ink',
  neutral: 'bg-surface text-content',
}

export function Badge({
  children,
  tone = 'brand',
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
