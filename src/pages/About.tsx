import { motion } from 'framer-motion'
import { CheckCircle2, Eye, MapPin, Quote, Target } from 'lucide-react'
import { Section } from '../components/ui/Section'
import { SectionHeading } from '../components/ui/SectionHeading'
import { ImagePlaceholder } from '../components/ui/ImagePlaceholder'
import { Reveal, RevealItem } from '../components/ui/Reveal'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'
import { fadeUp, reveal } from '../lib/motion'
import { about, contact, site, TODO } from '../data/site'

export function About() {
  return (
    <>
      <PageHero
        crumb="About"
        eyebrow="About the School"
        title="A gurukul spirit, carried into the present"
        subtitle="Where classroom learning, physical training, art, spirituality and self-discipline grow together."
      />

      {/* Intro + name meaning */}
      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <motion.p variants={fadeUp} {...reveal} className="text-lg leading-relaxed text-content">
              {about.intro}
            </motion.p>
            <motion.div variants={fadeUp} {...reveal} className="mt-8">
              <h2 className="text-2xl font-bold text-heading">{about.name.title}</h2>
              <p className="mt-4 leading-relaxed text-content">{about.name.body}</p>
            </motion.div>
          </div>
          <motion.div variants={fadeUp} {...reveal}>
            <div className="group relative aspect-[5/4] overflow-hidden rounded-2xl border border-border shadow-card">
              {contact.mapEmbed === TODO ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-tint-blue to-tint-pink text-center">
                  <MapPin className="h-10 w-10 text-brand" />
                  <div className="px-6">
                    <div className="font-semibold text-heading">{site.name}</div>
                    <div className="mt-1 text-sm text-content">{contact.address}</div>
                  </div>
                </div>
              ) : (
                <>
                  <iframe
                    title="Campus location — satellite view"
                    src={contact.mapEmbed}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  {/* Scrim + centered address; desktop hover fades it to reveal the embed, tap opens the Google Maps app */}
                  <a
                    href={contact.mapLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open campus location in Google Maps"
                    className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center transition-opacity duration-300 group-hover:pointer-events-none group-hover:opacity-0 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <MapPin className="h-9 w-9 text-white" />
                      <div>
                        <div className="text-lg font-bold text-white">{site.name}</div>
                        <div className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-white">
                          {contact.address}
                        </div>
                        <span className="mt-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white lg:hidden">
                          Tap to open in Google Maps
                        </span>
                      </div>
                    </div>
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Vision & Mission */}
      <Section tone="blue">
        <div className="grid gap-6 lg:grid-cols-5">
          <RevealItem className="lg:col-span-2">
            <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-8 shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-tint-blue text-brand">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-heading">Our Vision</h3>
              <p className="mt-3 leading-relaxed text-content">{about.vision}</p>
            </div>
          </RevealItem>
          <Reveal className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tint-pink text-accent-strong">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-heading">Our Mission</h3>
              </div>
              <ul className="flex flex-col gap-3">
                {about.mission.map((m) => (
                  <motion.li key={m} variants={fadeUp} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                    <span className="text-sm leading-relaxed text-content">{m}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Message */}
      <Section>
        <motion.div
          variants={fadeUp}
          {...reveal}
          className="mx-auto max-w-3xl rounded-3xl border border-border bg-gradient-to-br from-tint-blue/60 to-tint-pink/60 p-8 text-center sm:p-12"
        >
          <h2 className="text-2xl font-bold text-heading">Our Message</h2>
          <p className="mt-4 text-lg leading-relaxed text-content">{about.message}</p>
        </motion.div>
      </Section>

      {/* Chairman */}
      <Section tone="surface">
        <SectionHeading eyebrow="From the Chairman's Desk" title="A word from our founder" />
        <motion.div
          variants={fadeUp}
          {...reveal}
          className="mx-auto mt-12 grid max-w-4xl gap-8 rounded-3xl border border-border bg-card p-8 shadow-card sm:grid-cols-[200px_1fr] sm:p-10"
        >
          <div className="mx-auto w-full max-w-[200px]">
            <ImagePlaceholder label={about.chairman.name} icon="GraduationCap" ratio="square" />
          </div>
          <div>
            <Quote className="h-9 w-9 text-accent" aria-hidden="true" />
            <blockquote className="mt-3 text-lg leading-relaxed text-heading italic">
              "{about.chairman.quote}"
            </blockquote>
            <div className="mt-5">
              <div className="font-semibold text-brand">{about.chairman.name}</div>
              <div className="text-sm text-muted">{about.chairman.role}</div>
            </div>
          </div>
        </motion.div>
      </Section>

      <CTABanner />
    </>
  )
}