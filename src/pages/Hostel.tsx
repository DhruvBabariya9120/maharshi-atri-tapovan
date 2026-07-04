import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { Section } from '../components/ui/Section'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Reveal } from '../components/ui/Reveal'
import { DayTimeline } from '../components/ui/DayTimeline'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'
import { Icon } from '../lib/icons'
import { fadeUp } from '../lib/motion'
import { hostel } from '../data/site'

/** Card that tilts in 3D toward the cursor, with the icon lifting off the surface. */
function TiltCard({ facility }: { facility: (typeof hostel.facilities)[number] }) {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(my, { stiffness: 200, damping: 18 })
  const rotateY = useSpring(mx, { stiffness: 200, damping: 18 })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    mx.set(px * 10)
    my.set(-py * 10)
  }
  function reset() {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div variants={fadeUp} className="[perspective:1200px]">
      <motion.div
        onMouseMove={handleMove}
        onMouseLeave={reset}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow duration-300 hover:border-brand/40 hover:shadow-lift"
      >
        {/* soft gradient glow on hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-linear-to-br from-brand/20 to-accent/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        />
        <div style={{ transform: 'translateZ(45px)' }} className="relative">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand to-accent text-white shadow-lift">
            <Icon name={facility.icon} className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-heading">{facility.title}</h3>
          <p className="text-sm leading-relaxed text-content">{facility.body}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function Hostel() {
  return (
    <>
      <PageHero
        crumb="Hostel"
        eyebrow="A Second Home"
        title="Hostel life is the heart of the tapovan"
        subtitle={hostel.intro}
      />

      {/* Facilities — 3D tilt cards */}
      <Section>
        <SectionHeading eyebrow="Hostel Facilities" title="Safe, hygienic and warm — first" />
        <Reveal
          className="mt-14 grid gap-6 [perspective:1200px] sm:grid-cols-2 lg:grid-cols-4"
          gap={0.07}
        >
          {hostel.facilities.map((f) => (
            <TiltCard key={f.title} facility={f} />
          ))}
        </Reveal>
      </Section>

      {/* A Day at the Tapovan — scroll-progress zig-zag timeline */}
      <Section tone="blue">
        <SectionHeading
          eyebrow="A Day at the Tapovan"
          title="From 05:15 wake-up to 21:30 lights out"
          subtitle="A rhythm that balances study, sport, prayer and rest — every single day."
        />
        <div className="mt-16">
          <DayTimeline
            entries={hostel.timetable.map((t) => ({
              marker: t.time,
              title: t.activity,
            }))}
          />
        </div>
      </Section>

      <CTABanner
        title="Come see the second home we've built."
        subtitle="Visit the campus with your son — see the rooms, dining and grounds for yourself."
      />
    </>
  )
}
