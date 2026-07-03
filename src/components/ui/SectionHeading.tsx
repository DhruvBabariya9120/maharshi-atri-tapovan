import { motion } from 'framer-motion'
import { Badge } from './Badge'
import { fadeUp, reveal, stagger } from '../../lib/motion'

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  tone = 'brand',
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  tone?: 'brand' | 'accent'
}) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left'
  return (
    <motion.div
      variants={stagger(0.12)}
      {...reveal}
      className={`flex max-w-2xl flex-col gap-4 ${alignment}`}
    >
      {eyebrow && (
        <motion.div variants={fadeUp}>
          <Badge tone={tone}>{eyebrow}</Badge>
        </motion.div>
      )}
      <motion.h2
        variants={fadeUp}
        className="text-3xl font-bold tracking-tight text-heading sm:text-4xl"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p variants={fadeUp} className="text-base leading-relaxed text-content sm:text-lg">
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}
