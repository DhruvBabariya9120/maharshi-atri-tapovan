import { Section } from '../components/ui/Section'
import { GalleryGrid } from '../components/ui/GalleryGrid'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'

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
      </Section>

      <CTABanner
        title="Photos tell part of the story. A visit tells the rest."
        subtitle="Schedule a campus visit and experience the tapovan in person."
      />
    </>
  )
}
