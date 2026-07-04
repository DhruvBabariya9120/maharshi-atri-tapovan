import { motion, type Variants } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Section } from '../components/ui/Section'
import { Tabs, type Tab } from '../components/ui/Tabs'
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
        /* Many short names → an energetic chip cloud */
        <motion.ul
          variants={stagger(0.025)}
          initial="hidden"
          animate="show"
          className="flex flex-wrap gap-2.5"
        >
          {group.items.map((item) => (
            <motion.li
              key={item}
              variants={cardIn}
              whileHover={{ y: -2 }}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-content shadow-card transition-colors duration-200 hover:border-brand hover:bg-tint-blue-soft hover:text-brand"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-linear-to-br from-brand to-accent" />
              {item}
            </motion.li>
          ))}
        </motion.ul>
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
