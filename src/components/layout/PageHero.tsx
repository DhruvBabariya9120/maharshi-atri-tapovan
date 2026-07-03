import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { Container } from '../ui/Container'
import { Badge } from '../ui/Badge'
import { fadeUp, stagger } from '../../lib/motion'

/** Reusable hero for inner pages — decorative gradient + breadcrumb. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  crumb,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  crumb: string
}) {
  return (
    <section className="relative overflow-hidden bg-brand-dark pt-28 pb-16 text-white sm:pt-36 sm:pb-24">
      {/* decorative shapes */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(59,130,246,0.35), transparent 40%), radial-gradient(circle at 85% 30%, rgba(244,114,182,0.3), transparent 45%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        aria-hidden="true"
      />
      <Container className="relative">
        <motion.div variants={stagger(0.1)} initial="hidden" animate="show" className="max-w-3xl">
          <motion.nav
            variants={fadeUp}
            aria-label="Breadcrumb"
            className="mb-5 flex items-center gap-1.5 text-sm text-white/70"
          >
            <Link to="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{crumb}</span>
          </motion.nav>
          {eyebrow && (
            <motion.div variants={fadeUp} className="mb-4">
              <Badge tone="accent" className="bg-white/15 text-white">
                {eyebrow}
              </Badge>
            </motion.div>
          )}
          <motion.h1
            variants={fadeUp}
            className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
              {subtitle}
            </motion.p>
          )}
        </motion.div>
      </Container>
    </section>
  )
}
