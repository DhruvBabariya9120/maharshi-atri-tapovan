import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { fadeUp, reveal, stagger } from '../../lib/motion'

/** Wraps children in a scroll-reveal container. Direct children with `variants={fadeUp}` stagger in. */
export function Reveal({
  children,
  className = '',
  gap = 0.09,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  gap?: number
  as?: 'div' | 'ul' | 'section'
}) {
  const MotionTag = motion[as]
  return (
    <MotionTag variants={stagger(gap)} {...reveal} className={className}>
      {children}
    </MotionTag>
  )
}

export function RevealItem({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  )
}
