import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Section } from '../components/ui/Section'
import { Tabs, type Tab } from '../components/ui/Tabs'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'
import { PendingNote } from '../components/ui/PendingNote'
import { Icon } from '../lib/icons'
import { fadeUp, reveal, stagger } from '../lib/motion'
import { campusLife } from '../data/site'

function GroupContent({ group }: { group: (typeof campusLife.groups)[number] }) {
  const isSports = group.key === 'sports'
  return (
    <div>
      <motion.ul
        variants={stagger(0.04)}
        initial="hidden"
        animate="show"
        className={
          isSports
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
            : 'grid gap-4 sm:grid-cols-2'
        }
      >
        {group.items.map((item) => (
          <motion.li
            key={item}
            variants={fadeUp}
            className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand ${
              isSports ? 'text-sm' : ''
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tint-blue text-brand">
              <Check className="h-4 w-4" />
            </span>
            <span className="font-medium text-heading">{item}</span>
          </motion.li>
        ))}
      </motion.ul>
      {group.note && (
        <p className="mt-6 rounded-xl bg-tint-blue/50 px-4 py-3 text-sm font-medium text-brand">
          {group.note}
        </p>
      )}
    </div>
  )
}

const tabs: Tab[] = campusLife.groups.map((g) => ({
  key: g.key,
  label: g.title.split(' & ')[0].split(',')[0],
  icon: <Icon name={g.icon} className="h-4 w-4" />,
  content: <GroupContent group={g} />,
}))

export function CampusLife() {
  return (
    <>
      <PageHero
        crumb="Campus Life"
        eyebrow="Beyond the Classroom"
        title="50+ activities, woven into daily life"
        subtitle={campusLife.intro}
      />

      <Section>
        <Tabs tabs={tabs} />
      </Section>

      {/* Quick highlight strip */}
      <Section tone="pink" className="!py-14">
        <motion.div
          variants={stagger(0.1)}
          {...reveal}
          className="grid gap-6 text-center sm:grid-cols-4"
        >
          {[
            { n: '20+', l: 'Sports & martial arts' },
            { n: 'Daily', l: 'Yoga, prayer & meditation' },
            { n: 'Annual', l: 'Historical drama & culture' },
            { n: 'Life', l: 'Skills & self-management' },
          ].map((s) => (
            <motion.div key={s.l} variants={fadeUp}>
              <div className="font-display text-3xl font-extrabold text-brand">{s.n}</div>
              <div className="mt-1 text-sm text-content">{s.l}</div>
            </motion.div>
          ))}
        </motion.div>
        <div className="mx-auto mt-8 max-w-xl text-center">
          <PendingNote>Activity photos and event highlights to be added to the Gallery.</PendingNote>
        </div>
      </Section>

      <CTABanner />
    </>
  )
}
