import { Section } from '../components/ui/Section'
import { GalleryGrid } from '../components/ui/GalleryGrid'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'
import { PendingNote } from '../components/ui/PendingNote'

export function Gallery() {
  return (
    <>
      <PageHero
        crumb="Gallery"
        eyebrow="Glimpses of the Tapovan"
        title="A campus that comes alive every day"
        subtitle="Annual functions, sports, festivals, prayer, art and hostel life — filter by category to explore."
      />

      <Section>
        <GalleryGrid />
        <div className="mx-auto mt-12 max-w-xl text-center">
          <PendingNote>
            Real photographs (annual function, sports, festivals, yoga, art, campus & hostel) will
            replace these placeholders once supplied by the school.
          </PendingNote>
        </div>
      </Section>

      <CTABanner
        title="Photos tell part of the story. A visit tells the rest."
        subtitle="Schedule a campus visit and experience the tapovan in person."
      />
    </>
  )
}
