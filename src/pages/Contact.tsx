import { motion } from 'framer-motion'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Section } from '../components/ui/Section'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal, RevealItem } from '../components/ui/Reveal'
import { PageHero } from '../components/layout/PageHero'
import { ContactForm } from '../components/forms/ContactForm'
import { PendingNote } from '../components/ui/PendingNote'
import { fadeUp, reveal } from '../lib/motion'
import { contact, site, TODO } from '../data/site'

const infoCards = [
  {
    icon: MapPin,
    label: 'Address',
    value: contact.address,
    pending: false,
  },
  {
    icon: Clock,
    label: 'Office Hours',
    value: contact.officeHours,
    pending: false,
  },
  {
    icon: Phone,
    label: 'Phone',
    value: contact.schoolOffice === TODO ? 'Phone number coming soon' : contact.schoolOffice,
    pending: contact.schoolOffice === TODO,
  },
  {
    icon: Mail,
    label: 'Email',
    value: contact.email === TODO ? 'Email coming soon' : contact.email,
    pending: contact.email === TODO,
  },
]

export function Contact() {
  return (
    <>
      <PageHero
        crumb="Contact"
        eyebrow="Contact & Location"
        title="We'd love to hear from you"
        subtitle="Reach out with any question, or plan a visit to the campus with your child."
      />

      {/* Info cards */}
      <Section>
        <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
          {infoCards.map((c) => (
            <RevealItem key={c.label}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-tint-blue text-brand">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-semibold tracking-wide text-accent-strong uppercase">
                  {c.label}
                </div>
                <div className="mt-1.5 text-sm leading-relaxed text-content">{c.value}</div>
              </div>
            </RevealItem>
          ))}
        </Reveal>
        <div className="mt-8">
          <PendingNote>
            Phone numbers, email, Google Maps link and social profiles to be confirmed by the school.
          </PendingNote>
        </div>
      </Section>

      {/* Map + Form */}
      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <motion.div variants={fadeUp} {...reveal}>
            <SectionHeading eyebrow="Find Us" title="On the Gandhinagar–Mahudi Road" align="left" />
            <div className="mt-6 overflow-hidden rounded-2xl border border-border shadow-card">
              {contact.mapEmbed === TODO ? (
                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-gradient-to-br from-tint-blue to-tint-pink text-center">
                  <MapPin className="h-10 w-10 text-brand" />
                  <div className="px-6">
                    <div className="font-semibold text-heading">{site.name}</div>
                    <div className="mt-1 text-sm text-content">{contact.address}</div>
                  </div>
                  <span className="text-[11px] font-medium tracking-wide text-muted uppercase">
                    Google Maps embed coming soon
                  </span>
                </div>
              ) : (
                <iframe
                  title="Campus location"
                  src={contact.mapEmbed}
                  className="aspect-[4/3] w-full"
                  loading="lazy"
                />
              )}
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            {...reveal}
            className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8"
          >
            <SectionHeading eyebrow="Send a Message" title="Ask us anything" align="left" />
            <div className="mt-6">
              <ContactForm />
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
