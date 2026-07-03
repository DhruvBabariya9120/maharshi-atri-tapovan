import { motion } from 'framer-motion'
import { CheckCircle2, FileText } from 'lucide-react'
import { Section } from '../components/ui/Section'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal, RevealItem } from '../components/ui/Reveal'
import { Timeline } from '../components/ui/Timeline'
import { PageHero } from '../components/layout/PageHero'
import { AdmissionForm } from '../components/forms/AdmissionForm'
import { fadeUp, reveal } from '../lib/motion'
import { admissions } from '../data/site'

export function Admissions() {
  return (
    <>
      <PageHero
        crumb="Admissions"
        eyebrow="Admissions Open"
        title="Give your son a place to grow"
        subtitle={admissions.intro}
      />

      {/* Eligibility + Process */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading eyebrow="Eligibility" title="Who can apply" align="left" />
            <ul className="mt-6 flex flex-col gap-3">
              {admissions.eligibility.map((e) => (
                <li key={e} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <span className="text-sm leading-relaxed text-content">{e}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading eyebrow="Admission Process" title="Four simple steps" align="left" />
            <div className="mt-8">
              <Timeline
                entries={admissions.process.map((p) => ({
                  marker: String(p.step),
                  title: p.title,
                  body: p.body,
                }))}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Documents */}
      <Section tone="blue">
        <SectionHeading eyebrow="Documents Required" title="Keep these ready" />
        <Reveal className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2" gap={0.06}>
          {admissions.documents.map((d) => (
            <RevealItem key={d}>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <FileText className="h-5 w-5 shrink-0 text-accent-strong" />
                <span className="text-sm font-medium text-heading">{d}</span>
              </div>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* Enquiry form */}
      <Section tone="surface">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div variants={fadeUp} {...reveal}>
            <SectionHeading
              eyebrow="Admission Enquiry"
              title="Request a call back"
              subtitle="Fill this form and our office will call you within 1–2 working days. Seats are limited."
              align="left"
            />
            <ul className="mt-8 flex flex-col gap-4">
              {admissions.process.map((p) => (
                <li key={p.step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-fg">
                    {p.step}
                  </span>
                  <span className="text-sm text-content">
                    <span className="font-semibold text-heading">{p.title}</span> — {p.body}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeUp}
            {...reveal}
            className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8"
          >
            <AdmissionForm />
          </motion.div>
        </div>
      </Section>
    </>
  )
}
