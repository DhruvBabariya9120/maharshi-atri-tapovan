import { motion } from 'framer-motion'
import { Container } from '../ui/Container'
import { fadeUp, stagger } from '../../lib/motion'

/** Reusable hero for inner pages — decorative gradient + breadcrumb. */
export function PageHero({
  eyebrow,
  title,
  subtitle,
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
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 18%, rgba(59,130,246,0.45), transparent 42%), radial-gradient(circle at 88% 22%, rgba(244,114,182,0.35), transparent 45%), radial-gradient(circle at 60% 90%, rgba(147,197,253,0.25), transparent 45%)',
          backgroundAttachment: 'fixed',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        aria-hidden="true"
      />
      <Container className="relative">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          {eyebrow && (
            <motion.div variants={fadeUp} className="mb-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white uppercase ring-1 ring-white/20 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {eyebrow}
              </span>
            </motion.div>
          )}
          <motion.h1
            variants={fadeUp}
            className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {title}
          </motion.h1>
          <motion.div
            variants={fadeUp}
            className="mt-6 h-1 w-16 rounded-full bg-linear-to-r from-accent to-white/50"
          />
          {subtitle && (
            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
              {subtitle}
            </motion.p>
          )}
        </motion.div>
      </Container>
    </section>
  )
}
