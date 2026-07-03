import { motion } from 'framer-motion'
import { ArrowRight, PhoneCall } from 'lucide-react'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { reveal, fadeUp } from '../../lib/motion'

export function CTABanner({
  title = 'Give your son a tapovan to grow in.',
  subtitle = 'Seats are limited. Enquire today, then visit the campus with your child before finalising.',
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <motion.div
          variants={fadeUp}
          {...reveal}
          className="relative overflow-hidden rounded-3xl bg-brand px-8 py-14 text-center shadow-lift sm:px-14"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(244,114,182,0.4), transparent 40%), radial-gradient(circle at 85% 80%, rgba(147,197,253,0.35), transparent 45%)',
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{title}</h2>
            <p className="mt-4 text-lg text-white/85">{subtitle}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button to="/admissions" variant="accent" size="lg">
                Admission Enquiry <ArrowRight className="h-4 w-4" />
              </Button>
              <Button to="/contact" variant="outline" size="lg" className="!border-white/40 !bg-white/10 !text-white hover:!border-white">
                <PhoneCall className="h-4 w-4" /> Contact the School
              </Button>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
