import { motion } from 'framer-motion'
import { Section } from '../components/ui/Section'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'
import { PendingNote } from '../components/ui/PendingNote'
import { Icon } from '../lib/icons'
import { fadeUp, reveal, stagger } from '../lib/motion'
import { achievements } from '../data/site'

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

      {/* Highlight strip */}
      <Section tone="surface" className="!py-12">
        <motion.div variants={stagger(0.09)} {...reveal} className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {highlights.map((h) => (
            <motion.div key={h.small} variants={fadeUp} className="text-center">
              <div className="font-display text-4xl font-extrabold text-brand sm:text-5xl">{h.big}</div>
              <div className="mt-2 text-sm text-content">{h.small}</div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Award cards */}
      <Section>
        <SectionHeading eyebrow="Honours" title="Recognition that reflects our values" />
        <Reveal className="mt-14 grid gap-6 md:grid-cols-2" gap={0.1}>
          {achievements.map((a) => (
            <motion.div
              key={a.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="group flex gap-5 rounded-2xl border border-border bg-card p-7 shadow-card transition-shadow duration-300 hover:shadow-lift"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent text-white shadow-card">
                <Icon name={a.icon} className="h-7 w-7" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-heading">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-content">{a.body}</p>
                {a.pending && <PendingNote>{a.pending}</PendingNote>}
              </div>
            </motion.div>
          ))}
        </Reveal>
      </Section>

      <CTABanner
        title="Be part of the next result to celebrate."
        subtitle="Admissions are open for the Primary Section up to Std 10."
      />
    </>
  )
}
