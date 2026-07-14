import { motion, type Variants } from 'framer-motion'
import { Dices, Sparkles, Swords, Target, Volleyball, type LucideIcon } from 'lucide-react'
import { Section } from '../components/ui/Section'
import { Tabs, type Tab } from '../components/ui/Tabs'
import { ImagePlaceholder } from '../components/ui/ImagePlaceholder'
import { PageHero } from '../components/layout/PageHero'
import { CTABanner } from '../components/sections/CTABanner'
import { Icon } from '../lib/icons'
import { fadeUp, reveal, stagger } from '../lib/motion'
import { campusLife } from '../data/site'

/** Premium spring pop-in. */
const cardIn: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 24 },
  },
}

/** The 20+ sports grouped into themed clusters — reads as a programme, not a flat word cloud. */
const sportClusters: { title: string; icon: LucideIcon; names: string[] }[] = [
  { title: 'Team Games', icon: Volleyball, names: ['Volleyball', 'Kabaddi', 'Kho-Kho', 'Basketball'] },
  { title: 'Racquet & Board', icon: Dices, names: ['Badminton', 'Table Tennis', 'Chess', 'Carrom'] },
  {
    title: 'Martial Arts & Combat',
    icon: Swords,
    names: ['Taekwondo', 'Judo', 'Boxing', 'Wrestling', 'Nunchaku', 'Lathidav'],
  },
  {
    title: 'Adventure & Precision',
    icon: Target,
    names: ['Skating', 'Rifle Shooting', 'Archery', 'Pyramid Formation', 'Burning Ring Jump', 'Acrobatic Exercise'],
  },
]

/** What each group's items are called — keeps the count line content-specific. */
const countLabel: Record<string, string> = {
  spirituality: 'daily practices',
  sports: 'sports & martial arts',
  culture: 'arts & activities',
  lifeskills: 'growth programmes',
}

function GroupContent({ group }: { group: (typeof campusLife.groups)[number] }) {
  const isSports = group.key === 'sports'
  return (
    <div>
      {/* Representative photo for the activity group — taller on mobile so the photo isn't a thin cropped strip */}
      {group.image && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="relative mb-8 overflow-hidden rounded-2xl"
        >
          <ImagePlaceholder
            src={group.image.src}
            alt={group.image.alt}
            ratio="auto"
            className="aspect-4/3 sm:aspect-16/7"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 to-transparent p-4 pt-12 text-sm font-medium text-white">
            {group.image.alt}
          </span>
        </motion.div>
      )}

      {/* Focused group header — orients the visitor the moment the tab opens */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mb-8 flex items-center gap-4"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-accent text-white shadow-lift">
          <Icon name={group.icon} className="h-7 w-7" strokeWidth={2} />
        </span>
        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-heading">
            {group.title}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-muted">
            <span className="font-semibold text-brand tabular-nums">{group.items.length}</span>{' '}
            {countLabel[group.key] ?? 'activities'}
          </p>
        </div>
      </motion.div>

      {isSports ? (
        /* 20+ sports → themed cluster cards instead of one flat chip cloud */
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2"
        >
          {sportClusters.map((cluster) => {
            // ponytail: names hardcoded to today's data; items missing from every cluster are simply not shown
            const items = group.items.filter((i) => cluster.names.includes(i))
            return (
              <motion.div
                key={cluster.title}
                variants={cardIn}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-colors duration-300 hover:border-brand/40"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-linear-to-r from-brand to-accent transition-transform duration-500 group-hover:scale-x-100"
                />
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand to-accent text-white shadow-lift transition-transform duration-300 group-hover:scale-110">
                    <cluster.icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <h4 className="font-semibold text-heading">{cluster.title}</h4>
                    <p className="text-xs font-medium text-muted">
                      <span className="font-semibold text-brand tabular-nums">{items.length}</span> activities
                    </p>
                  </div>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-border bg-tint-blue-soft px-3 py-1.5 text-xs font-medium text-content transition-colors duration-200 hover:border-brand hover:text-brand"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        /* Fewer, descriptive items → numbered editorial cards that highlight title + detail */
        <motion.ul
          variants={stagger(0.06)}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2"
        >
          {group.items.map((item, i) => {
            const [title, ...rest] = item.split(' — ')
            const desc = rest.join(' — ')
            return (
              <motion.li
                key={item}
                variants={cardIn}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-colors duration-300 hover:border-brand/40"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-0 h-full w-1 origin-top scale-y-0 bg-linear-to-b from-brand to-accent transition-transform duration-300 group-hover:scale-y-100"
                />
                <div className="flex items-start gap-4">
                  <span className="font-display bg-linear-to-br from-brand to-accent bg-clip-text text-2xl font-extrabold tabular-nums text-transparent">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-semibold leading-snug text-heading">{title}</p>
                    {desc && <p className="mt-1 text-sm leading-relaxed text-content">{desc}</p>}
                  </div>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      )}

      {group.note && (
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-6 flex items-center gap-2.5 rounded-xl border border-brand/10 bg-linear-to-r from-tint-blue-soft to-tint-pink-soft px-4 py-3 text-sm font-medium text-brand"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-accent" />
          {group.note}
        </motion.p>
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
            <motion.div
              key={s.l}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <div className="font-display bg-linear-to-r from-brand to-accent bg-clip-text text-3xl font-extrabold text-transparent">
                {s.n}
              </div>
              <div className="mt-1 text-sm text-content">{s.l}</div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <CTABanner />
    </>
  )
}