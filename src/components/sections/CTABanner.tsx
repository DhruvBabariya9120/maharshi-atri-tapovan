import { motion } from 'framer-motion'
import { ArrowRight, PhoneCall } from 'lucide-react'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { reveal, fadeUp } from '../../lib/motion'
import { contact } from '../../data/site'

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
          className="relative overflow-hidden rounded-3xl bg-brand-dark px-8 py-16 text-center shadow-lift ring-1 ring-white/10 sm:px-14"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 18%, rgba(59,130,246,0.45), transparent 42%), radial-gradient(circle at 88% 22%, rgba(244,114,182,0.35), transparent 45%), radial-gradient(circle at 60% 90%, rgba(147,197,253,0.25), transparent 45%)',
          }}
        >
          <div className="relative mx-auto max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase backdrop-blur">
              Admissions Open
            </span>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{title}</h2>
            <p className="mt-4 text-lg text-white/85">{subtitle}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button to="/admissions" variant="accent" size="lg">
                Admission Enquiry <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href={`tel:${contact.schoolOffice.replace(/\s+/g, '')}`} variant="outline" size="lg" className="!border-white/40 !bg-white/10 !text-white hover:!border-white">
                <PhoneCall className="h-4 w-4" /> Contact the School
              </Button>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
