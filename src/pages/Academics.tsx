import { motion } from 'framer-motion'
import { CheckCircle2, ClipboardCheck, GraduationCap } from 'lucide-react'
import { Section } from '../components/ui/Section'
import { SectionHeading } from '../components/ui/SectionHeading'
import { IconCard } from '../components/ui/Card'
import { Reveal, RevealItem } from '../components/ui/Reveal'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'
import { Icon } from '../lib/icons'
import { fadeUp, reveal } from '../lib/motion'
import { academics } from '../data/site'

export function Academics() {
  return (
    <>
      <PageHero
        crumb="Academics"
        eyebrow="Academics"
        title="Modern learning, gurukul discipline"
        subtitle={academics.intro}
      />

      {/* Fact cards */}
      <Section>
        <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {academics.facts.map((f) => (
            <RevealItem key={f.label}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="text-xs font-semibold tracking-wide text-accent-strong uppercase">
                  {f.label}
                </div>
                <div className="mt-2 text-lg font-semibold text-heading">{f.value}</div>
              </div>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* Weekly test + results */}
      <Section tone="blue">
        <div className="grid gap-6 lg:grid-cols-2">
          <RevealItem>
            <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-8 shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-tint-blue text-brand">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-heading">{academics.weeklyTest.title}</h3>
              <p className="mt-3 leading-relaxed text-content">{academics.weeklyTest.body}</p>
            </div>
          </RevealItem>
          <RevealItem>
            <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-8 shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-tint-pink text-accent-strong">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-heading">Board Results</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {academics.results.map((r) => (
                  <li key={r} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                    <span className="text-sm leading-relaxed text-content">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </RevealItem>
        </div>
      </Section>

      {/* Facilities */}
      <Section>
        <SectionHeading
          eyebrow="Facilities"
          title="Everything a focused student needs"
          subtitle="Smart classrooms, labs and quiet green spaces — all on one campus."
        />
        <Reveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
          {academics.facilities.map((f) => (
            <IconCard key={f.title} icon={<Icon name={f.icon} className="h-6 w-6" />} title={f.title}>
              {f.body}
            </IconCard>
          ))}
        </Reveal>
        <motion.p variants={fadeUp} {...reveal} className="mt-10 text-center text-sm text-muted">
          {academics.facts[2].value} · {academics.facts[0].value} · {academics.facts[1].value} medium
        </motion.p>
      </Section>

      <CTABanner />
    </>
  )
}
