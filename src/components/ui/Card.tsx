import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeUp } from '../../lib/motion'

export function Card({
  children,
  className = '',
  hover = true,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={hover ? { y: -6 } : undefined}
      className={`group rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow duration-300 ${
        hover ? 'hover:shadow-lift' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  )
}

/** Card with a circular icon chip on top. */
export function IconCard({
  icon,
  title,
  children,
  className = '',
}: {
  icon: ReactNode
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-tint-blue text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-fg">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-heading">{title}</h3>
      <p className="text-sm leading-relaxed text-content">{children}</p>
    </Card>
  )
}
