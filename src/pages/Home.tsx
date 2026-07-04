import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  HeartHandshake,
  Home as HomeIcon,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { Container } from '../components/ui/Container'
import { Section } from '../components/ui/Section'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SectionHeading } from '../components/ui/SectionHeading'
import { IconCard } from '../components/ui/Card'
import { StatCounter } from '../components/ui/StatCounter'
import { ImagePlaceholder } from '../components/ui/ImagePlaceholder'
import { Icon } from '../lib/icons'
import { TestimonialCarousel } from '../components/ui/TestimonialCarousel'
import { GalleryGrid } from '../components/ui/GalleryGrid'
import { Reveal, RevealItem } from '../components/ui/Reveal'
import { CTABanner } from '../components/sections/CTABanner'
import { fadeUp, reveal, stagger } from '../lib/motion'
import { about, academics, campusLife, hero, hostel, site, stats, testimonials } from '../data/site'

const whyMat = [
  {
    icon: BookOpen,
    title: 'Consistent Academic Results',
    body: 'GSEB Gujarati-medium curriculum with weekly testing and supervised study — 100% SSC results for 3 years running.',
  },
  {
    icon: Sparkles,
    title: 'Sanskar & Spirituality',
    body: 'Daily prayer, Gita chanting, yoga and meditation root every boy in Indian values and self-discipline.',
  },
  {
    icon: Trophy,
    title: '50+ Activities',
    body: '20+ sports and martial arts, drama, oratory, music and art — every boy finds where he shines.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe, CCTV-Covered Campus',
    body: 'A silent, green, pollution-free campus under round-the-clock CCTV and caretaker supervision.',
  },
  {
    icon: HomeIcon,
    title: 'A Hostel That Feels Like Home',
    body: 'Airy rooms, personal bed & locker, organic hygienic food and daily sanitation for growing children.',
  },
  {
    icon: HeartHandshake,
    title: 'Life Skills for the Real World',
    body: 'Self-managed routines, counselling and gruh udyog build responsible, self-reliant young men.',
  },
]

const previews = [
  {
    eyebrow: 'Academics',
    title: 'Modern learning, gurukul discipline',
    body: academics.intro,
    to: '/academics',
    icon: 'BookOpen',
  },
  {
    eyebrow: 'Campus Life',
    title: 'A day that trains body, mind & spirit',
    body: campusLife.intro,
    to: '/campus-life',
    icon: 'Trophy',
  },
  {
    eyebrow: 'Hostel',
    title: 'A second home, safe and warm',
    body: hostel.intro,
    to: '/hostel',
    icon: 'BedDouble',
  },
]

function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-blue-900 pt-28 pb-20 text-white sm:pt-40 sm:pb-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 18%, rgba(59,130,246,0.35), transparent 42%), radial-gradient(circle at 88% 22%, rgba(244,114,182,0.18), transparent 45%), radial-gradient(circle at 60% 90%, rgba(147,197,253,0.18), transparent 45%)',
          backgroundAttachment: 'fixed',
        }}
        aria-hidden="true"
      />
      <Container className="relative grid items-center gap-12 lg:grid-cols-2">
        <motion.div variants={stagger(0.12)} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <Badge tone="accent" className="bg-white/15 text-white">
              <BadgeCheck className="h-3.5 w-3.5" /> {site.board} · {site.medium}
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="font-hero text-tint-pink mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl"
          >
            {hero.headline}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/80"
          >
            {hero.subheadline}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to={hero.primaryCta.to} variant="accent" size="lg">
              {hero.primaryCta.label} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              to={hero.secondaryCta.to}
              variant="outline"
              size="lg"
              className="!border-white/40 !bg-white/10 !text-white hover:!border-white"
            >
              {hero.secondaryCta.label}
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="grid grid-cols-2 gap-4">
            <ImagePlaceholder label="Campus" icon="Trees" ratio="portrait" className="mt-8" />
            <ImagePlaceholder label="Annual Function" icon="PartyPopper" ratio="portrait" />
            <ImagePlaceholder label="Yoga & Prayer" icon="Flower2" ratio="portrait" />
            <ImagePlaceholder label="Sports" icon="Trophy" ratio="portrait" className="-mt-8" />
          </div>
        </motion.div>
      </Container>
    </section>
  )
}

export function Home() {
  return (
    <>
      <HomeHero />

      {/* Stats strip */}
      <Section tone="surface" className="!py-16">
        <Reveal className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" gap={0.08}>
          {stats.map((s) => (
            <RevealItem key={s.label} className="h-full">
              <StatCounter stat={s} />
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* About teaser */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div variants={fadeRightWrap} {...reveal}>
            <ImagePlaceholder label="MAT Campus, Piplaj" icon="Building2" ratio="video" />
          </motion.div>
          <div>
            <SectionHeading
              eyebrow="About MAT"
              title="A modern-day tapovan since 2003"
              align="left"
            />
            <motion.p variants={fadeUp} {...reveal} className="text-content mt-6 leading-relaxed">
              {about.intro}
            </motion.p>
            <div className="mt-8">
              <Button to="/about" variant="primary">
                Read Our Story <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Why MAT */}
      <Section tone="blue">
        <SectionHeading
          eyebrow="Why Maharshi Atri Tapovan"
          title="Strong in studies. Rooted in sanskar. Skilled for life."
          subtitle="Everything a residential education should be — academics, character, health and life skills, under one green campus."
        />
        <Reveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyMat.map((f) => (
            <IconCard
              key={f.title}
              icon={<f.icon className="h-6 w-6" strokeWidth={1.75} />}
              title={f.title}
            >
              {f.body}
            </IconCard>
          ))}
        </Reveal>
      </Section>

      {/* Section previews */}
      <Section>
        <SectionHeading eyebrow="Explore the Tapovan" title="Life at MAT, section by section" />
        <Reveal className="mt-14 grid gap-6 md:grid-cols-3">
          {previews.map((p) => (
            <RevealItem key={p.to}>
              <Link
                to={p.to}
                className="group border-border bg-card shadow-card hover:border-brand/40 hover:shadow-lift relative flex h-full flex-col overflow-hidden rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1.5"
              >
                {/* top accent that grows on hover */}
                <span className="from-brand to-accent absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-linear-to-r transition-transform duration-300 group-hover:scale-x-100" />
                <div className="bg-tint-blue text-brand group-hover:bg-brand group-hover:text-brand-fg flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300">
                  <Icon name={p.icon} className="h-7 w-7" />
                </div>
                <span className="text-brand mt-6 text-xs font-semibold tracking-wide uppercase">
                  {p.eyebrow}
                </span>
                <h3 className="font-display text-heading group-hover:text-brand mt-2 text-xl font-bold transition-colors">
                  {p.title}
                </h3>
                <p className="text-content mt-3 flex-1 text-sm leading-relaxed">{p.body}</p>
                <span className="text-brand mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5">
                  Explore more <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* Achievements strip */}
      <Section tone="pink">
        <SectionHeading
          eyebrow="Achievements"
          title="Results and recognition that speak for themselves"
        />
        <Reveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" gap={0.1}>
          {[
            { big: '100%', small: 'SSC results, 3 years running', icon: 'Award' },
            { big: 'Top 3', small: 'In Gujarat, SSC 2026', icon: 'Medal' },
            { big: '50+', small: 'Activities beyond books', icon: 'Trophy' },
            { big: 'Govt.', small: 'Recognised for moral education', icon: 'GraduationCap' },
          ].map((a) => (
            <RevealItem key={a.small}>
              <div className="group border-border bg-card shadow-card hover:border-accent/40 hover:shadow-lift flex h-full flex-col items-center rounded-3xl border p-8 text-center transition-all duration-300 hover:-translate-y-1.5">
                <div className="bg-tint-pink text-accent-strong group-hover:bg-accent group-hover:text-accent-fg mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300">
                  <Icon name={a.icon} className="h-6 w-6" />
                </div>
                <div className="font-display text-heading text-4xl font-extrabold tracking-tight">
                  {a.big}
                </div>
                <div className="text-muted mt-2 text-sm">{a.small}</div>
              </div>
            </RevealItem>
          ))}
        </Reveal>
        <div className="mt-10 text-center">
          <Button to="/achievements" variant="outline">
            See All Achievements <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Section>

      {/* Gallery preview */}
      <Section>
        <SectionHeading eyebrow="Gallery" title="Glimpses of the tapovan" />
        <div className="mt-14">
          <GalleryGrid />
        </div>
      </Section>

      {/* Testimonials */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="Testimonials"
          title="What parents and students say"
          subtitle={testimonials.note}
        />
        <div className="mt-14">
          <TestimonialCarousel items={testimonials.items} />
        </div>
      </Section>

      <CTABanner />
    </>
  )
}

// local variant for the about image
const fadeRightWrap = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}
