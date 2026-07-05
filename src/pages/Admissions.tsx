import { motion } from 'framer-motion'
import { Check, FileText, PhoneCall } from 'lucide-react'
import { Section } from '../components/ui/Section'
import { SectionHeading } from '../components/ui/SectionHeading'
import { PageHero } from '../components/layout/PageHero'
import { AdmissionForm } from '../components/forms/AdmissionForm'
import { fadeUp, reveal, stagger } from '../lib/motion'
import { admissions } from '../data/site'

const reassurance = [
  'Seats are limited — early enquiries get priority.',
  'Our office calls you back within 1–2 working days.',
  'Campus visits with your son are always welcome.',
]

export function Admissions() {
  return (
    <>
      <PageHero
        crumb="Admissions"
        eyebrow="Admissions Open"
        title="Give your son a place to grow"
        subtitle={admissions.intro}
      />

      {/* 1 — ENQUIRY FORM: the conversion focal point, led first */}
      <Section tone="surface">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div variants={fadeUp} {...reveal}>
            <SectionHeading
              eyebrow="Admission Enquiry"
              title="Request a call back"
              subtitle="Fill this form and our office will call you within 1–2 working days."
              align="left"
            />
            <ul className="mt-8 flex flex-col gap-4">
              {reassurance.map((r) => (
                <li key={r} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint-blue text-brand">
                    <PhoneCall className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-relaxed text-content">{r}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            variants={fadeUp}
            {...reveal}
            className="relative rounded-3xl bg-linear-to-br from-brand to-accent p-[2px] shadow-lift"
          >
            <div className="rounded-[calc(1.5rem-2px)] bg-card p-6 sm:p-8">
              <AdmissionForm />
            </div>
          </motion.div>
        </div>
      </Section>

      {/* 2 — PROCESS: how easy it is (horizontal animated stepper) */}
      <Section>
        <SectionHeading eyebrow="Admission Process" title="Four simple steps" />
        <div className="relative mx-auto mt-16 max-w-5xl">
          {/* connecting track + gradient fill (desktop) */}
          <span
            aria-hidden="true"
            className="absolute top-6 right-0 left-0 hidden h-0.5 bg-border sm:block"
          />
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-6 right-0 left-0 hidden h-0.5 origin-left bg-linear-to-r from-brand to-accent sm:block"
          />
          <motion.ol
            variants={stagger(0.15)}
            {...reveal}
            className="relative grid gap-10 sm:grid-cols-4"
          >
            {admissions.process.map((p) => (
              <motion.li key={p.step} variants={fadeUp} className="text-center">
                <motion.span
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="ring-body relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-brand to-accent text-base font-bold text-white shadow-lift ring-4"
                >
                  {p.step}
                </motion.span>
                <h3 className="mt-4 font-semibold text-heading">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-content">{p.body}</p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </Section>

      {/* 3 — ELIGIBILITY + DOCUMENTS */}
      <Section tone="blue">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Eligibility" title="Who can apply" align="left" />
            <motion.ul
              variants={stagger(0.08)}
              {...reveal}
              className="mt-6 flex flex-col gap-3"
            >
              {admissions.eligibility.map((e) => (
                <motion.li
                  key={e}
                  variants={fadeUp}
                  className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-accent text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-content">{e}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
          <div>
            <SectionHeading eyebrow="Documents Required" title="Keep these ready" align="left" />
            <motion.ul
              variants={stagger(0.06)}
              {...reveal}
              className="mt-6 grid gap-3 sm:grid-cols-2"
            >
              {admissions.documents.map((d) => (
                <motion.li
                  key={d}
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors duration-200 hover:border-brand/40"
                >
                  <FileText className="h-5 w-5 shrink-0 text-accent-strong transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-sm font-medium text-heading">{d}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </Section>

    </>
  )
}
