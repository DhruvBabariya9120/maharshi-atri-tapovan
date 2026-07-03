import { Section } from '../components/ui/Section'
import { SectionHeading } from '../components/ui/SectionHeading'
import { IconCard } from '../components/ui/Card'
import { Reveal } from '../components/ui/Reveal'
import { Timeline } from '../components/ui/Timeline'
import { ImagePlaceholder } from '../components/ui/ImagePlaceholder'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'
import { PendingNote } from '../components/ui/PendingNote'
import { Icon } from '../lib/icons'
import { hostel } from '../data/site'

export function Hostel() {
  return (
    <>
      <PageHero
        crumb="Hostel"
        eyebrow="A Second Home"
        title="Hostel life is the heart of the tapovan"
        subtitle={hostel.intro}
      />

      {/* Facilities */}
      <Section>
        <SectionHeading
          eyebrow="Hostel Facilities"
          title="Safe, hygienic and warm — first"
        />
        <Reveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
          {hostel.facilities.map((f) => (
            <IconCard key={f.title} icon={<Icon name={f.icon} className="h-6 w-6" />} title={f.title}>
              {f.body}
            </IconCard>
          ))}
        </Reveal>
      </Section>

      {/* A Day at the Tapovan */}
      <Section tone="blue">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="A Day at the Tapovan"
              title="From 05:15 wake-up to 21:30 lights out"
              align="left"
            />
            <div className="mt-6">
              <ImagePlaceholder label="Hostel & Dining" icon="BedDouble" ratio="video" />
            </div>
            <PendingNote>{hostel.timetableNote}</PendingNote>
          </div>
          <Timeline
            entries={hostel.timetable.map((t) => ({
              marker: t.time,
              title: t.activity,
              muted: !t.confirmed,
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
