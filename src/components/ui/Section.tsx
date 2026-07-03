import type { ReactNode } from 'react'
import { Container } from './Container'

type Tone = 'default' | 'surface' | 'blue' | 'pink'

const tones: Record<Tone, string> = {
  default: 'bg-body',
  surface: 'bg-surface',
  blue: 'bg-tint-blue-soft',
  pink: 'bg-tint-pink-soft',
}

export function Section({
  children,
  tone = 'default',
  className = '',
  id,
  containerClassName = '',
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  id?: string
  containerClassName?: string
}) {
  return (
    <section id={id} className={`py-16 sm:py-24 ${tones[tone]} ${className}`}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}
