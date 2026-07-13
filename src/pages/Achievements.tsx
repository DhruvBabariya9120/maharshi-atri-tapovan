import { motion } from 'framer-motion'
import { Section } from '../components/ui/Section'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { ImagePlaceholder } from '../components/ui/ImagePlaceholder'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'
import { Icon } from '../lib/icons'
import { fadeUp, reveal, stagger } from '../lib/motion'
import { achievements, photos } from '../data/site'

const highlights = [
  { big: '100%', small: 'SSC results · 3 years running' },
  { big: 'Top 3', small: 'In Gujarat · SSC 2026' },
  { big: 'Nat’l', small: 'International sports honours' },
  { big: 'Longest', small: 'Historical drama staged' },
]

export function Achievements() {
  return (
    <>
      <PageHero
        crumb="Achievements"
        eyebrow="Awards & Achievements"
        title="Results and recognition, earned year after year"
        subtitle="Academics, sports, culture and character — our boys carry the tapovan's name far."
      />

      {/* Highlight strip — flowing gradient numbers */}
      <Section tone="surface" className="!py-12">
        <motion.div
          variants={stagger(0.09)}
          {...reveal}
          className="grid grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {highlights.map((h) => (
            <motion.div key={h.small} variants={fadeUp} className="text-center">
              <div className="text-gradient-animate font-display text-4xl font-extrabold sm:text-5xl">
                {h.big}
              </div>
              <div className="mt-2 text-sm text-content">{h.small}</div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Featured moment — prize distribution */}
      <Section>
        <Reveal className="grid items-center gap-10 lg:grid-cols-2" gap={0.12}>
          <ImagePlaceholder src={photos.award.src} alt={photos.award.alt} ratio="video" />
          <div>
            <SectionHeading
              eyebrow="Celebrated on Stage"
              title="Effort, recognised in front of everyone"
              align="left"
            />
            <p className="mt-6 leading-relaxed text-content">
              From board toppers to sports and cultural champions, students are honoured on the
              Annual Function stage — a moment of pride shared with parents, teachers and the whole
              tapovan.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Award cards — rotating glow border + shine sweep + watermark index */}
      <Section tone="surface">
        <SectionHeading eyebrow="Honours" title="Recognition that reflects our values" />
        <Reveal className="mt-14 grid items-stretch gap-6 md:grid-cols-2" gap={0.1}>
          {achievements.map((a, i) => (
            <motion.div
              key={a.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="group relative h-full"
            >
              <div className="relative flex h-full items-start gap-5 overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-card transition-shadow duration-300 hover:shadow-lift">
                {/* shine sweep */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-linear-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                />
                {/* watermark number */}
                <span className="font-display pointer-events-none absolute -top-2 right-3 text-7xl font-black text-brand/[0.06] select-none">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-accent text-white shadow-lift transition-transform duration-300 group-hover:scale-110">
                  <Icon name={a.icon} className="h-7 w-7" strokeWidth={2} />
                </div>
                <div className="relative min-w-0">
                  <h3 className="text-lg leading-snug font-semibold text-balance text-heading">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-content">{a.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </Reveal>
      </Section>

      <CTABanner
        title="Be part of the next result to celebrate."
        subtitle="Admissions are open for Std 4 to Std 10."
      />
    </>
  )
}
