import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { ClipboardCheck, Search, TrendingUp } from 'lucide-react'
import { Section } from '../components/ui/Section'
import { SectionHeading } from '../components/ui/SectionHeading'
import { RevealItem, Reveal } from '../components/ui/Reveal'
import { ImagePlaceholder } from '../components/ui/ImagePlaceholder'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'
import { Icon } from '../lib/icons'
import { fadeUp, fadeRight, reveal, stagger } from '../lib/motion'
import { academics, photos } from '../data/site'

/** Count-up number that runs once when scrolled into view (jumps to final if reduced-motion). */
function CountUp({ to, suffix }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setVal(to)
      return
    }
    const controls = animate(0, to, {
      duration: 1.6,
      ease: 'easeOut',
      onUpdate: (v) => setVal(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, to, reduce])

  return (
    <span ref={ref} className="tabular-nums">
      {val}
      {suffix}
    </span>
  )
}

/** The page's headline proof — big, animated. */
const resultStats: { value?: number; suffix?: string; display?: string; label: string }[] = [
  { value: 100, suffix: '%', label: 'SSC board result, 3 years running' },
  { value: 3, label: 'consecutive years at 100%' },
  { display: 'Top 3', label: 'ranked in Gujarat · SSC 2026' },
]

/** How weekly testing turns into results — derived from the weekly-test description. */
const method = [
  {
    icon: ClipboardCheck,
    title: 'Weekly tests',
    body: 'Every boy is tested across subjects, every week — not just at term-end.',
  },
  {
    icon: Search,
    title: 'Gaps caught early',
    body: 'Learning gaps surface immediately, long before board examinations.',
  },
  {
    icon: TrendingUp,
    title: 'Corrected in time',
    body: 'Targeted revision lifts every student — not only the toppers.',
  },
]

export function Academics() {
  return (
    <>
      <PageHero
        crumb="Academics"
        eyebrow="Academics"
        title="Modern learning, gurukul discipline"
        subtitle={academics.intro}
      />

      {/* 1 — RESULTS: the strongest hook, led with, on a premium animated band */}
      <Section>
        <RevealItem>
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand via-brand-dark to-indigo-900 p-8 text-white shadow-lift sm:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 12% 15%, rgba(59,130,246,0.35), transparent 42%), radial-gradient(circle at 88% 20%, rgba(244,114,182,0.30), transparent 46%)',
              }}
            />
            {/* decorative blob (static — an animated blur repaints every frame) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-accent/25 blur-3xl"
            />
            <div className="relative text-center">
              <motion.div variants={fadeUp} {...reveal}>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white uppercase ring-1 ring-white/20 backdrop-blur">
                  Proven Results
                </span>
                <h2 className="font-hero mx-auto mt-5 max-w-2xl text-3xl font-black tracking-tight text-balance text-tint-pink sm:text-4xl">
                  100% SSC results, three years running
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75">
                  Every boy who sat the SSC (Std 10) Board examination in the last three years has passed.
                </p>
              </motion.div>

              <motion.div
                variants={stagger(0.12)}
                {...reveal}
                className="mx-auto mt-10 grid max-w-3xl divide-y divide-white/15 border-t border-white/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
              >
                {resultStats.map((s) => (
                  <motion.div key={s.label} variants={fadeUp} className="px-6 py-6 sm:py-8">
                    <div className="font-display text-5xl font-extrabold tracking-tight text-white">
                      {s.display ?? <CountUp to={s.value!} suffix={s.suffix} />}
                    </div>
                    <div className="mx-auto mt-2 max-w-[16ch] text-sm leading-snug text-white/75">{s.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </RevealItem>
      </Section>

      {/* 2 — WHY IT WORKS: the method behind the results, as an animated 3-step flow */}
      <Section tone="blue" className="!pt-6">
        <SectionHeading
          eyebrow="Why It Works"
          title={academics.weeklyTest.title}
          subtitle={academics.weeklyTest.body}
        />
        <motion.div
          variants={stagger(0.12)}
          {...reveal}
          className="relative mt-14 grid gap-6 sm:grid-cols-3"
        >
          {method.map((m, i) => (
            <motion.div
              key={m.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-card transition-shadow duration-300 hover:shadow-lift"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-linear-to-r from-brand to-accent transition-transform duration-500 group-hover:scale-x-100"
              />
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand to-accent text-white shadow-lift transition-transform duration-300 group-hover:scale-110">
                  <m.icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <span className="font-display bg-linear-to-br from-brand to-accent bg-clip-text text-2xl font-extrabold tabular-nums text-transparent">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-heading">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-content">{m.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* 3 — AT A GLANCE: supporting facts, as a spec ledger sliding in from the left */}
      <Section>
        <SectionHeading eyebrow="At a Glance" title="The essentials, in one view" />
        <motion.div
          variants={stagger(0.08)}
          {...reveal}
          className="mx-auto mt-12 max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card"
        >
          {academics.facts.map((f, i) => (
            <motion.div
              key={f.label}
              variants={fadeRight}
              className="group relative flex items-center gap-5 px-6 py-5 transition-colors duration-300 hover:bg-tint-blue-soft"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 h-full w-1 origin-top scale-y-0 bg-linear-to-b from-brand to-accent transition-transform duration-300 group-hover:scale-y-100"
              />
              <span className="font-display w-8 shrink-0 bg-linear-to-br from-brand to-accent bg-clip-text text-lg font-extrabold tabular-nums text-transparent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <div className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {f.label}
                </div>
                <div className="mt-0.5 font-semibold text-heading">{f.value}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* 3b — IN ACTION: real photos of labs & library */}
      <Section tone="blue" className="!pt-6">
        <SectionHeading
          eyebrow="Learning in Action"
          title="Hands-on, every day"
          subtitle="From library reading to live experiments — learning at MAT goes well beyond the textbook."
        />
        <Reveal className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" gap={0.1}>
          <RevealItem>
            <ImagePlaceholder src={photos.smartClass.src} alt={photos.smartClass.alt} ratio="video" />
          </RevealItem>
          <RevealItem>
            <ImagePlaceholder src={photos.library.src} alt={photos.library.alt} ratio="video" />
          </RevealItem>
          <RevealItem>
            <ImagePlaceholder src={photos.scienceLab.src} alt={photos.scienceLab.alt} ratio="video" />
          </RevealItem>
        </Reveal>
      </Section>

      {/* 4 — FACILITIES: visual grid, cards with a gradient top-border that draws in */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="Facilities"
          title="Everything a focused student needs"
          subtitle="Smart classrooms, labs and quiet green spaces — all on one campus."
        />
        <motion.div
          variants={stagger(0.07)}
          {...reveal}
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {academics.facilities.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow duration-300 hover:shadow-lift"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-linear-to-r from-brand to-accent transition-transform duration-500 group-hover:scale-x-100"
              />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-tint-blue text-brand transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-linear-to-br group-hover:from-brand group-hover:to-accent group-hover:text-white">
                <Icon name={f.icon} className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-heading">{f.title}</h3>
              <p className="text-sm leading-relaxed text-content">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <CTABanner />
    </>
  )
}