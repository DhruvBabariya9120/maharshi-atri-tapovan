import { motion } from 'framer-motion'
import { fadeUp, reveal, stagger } from '../../lib/motion'

export type TimelineEntry = {
  marker: string // time or step number
  title: string
  body?: string
  muted?: boolean // dim rows that are not yet confirmed
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <motion.ol variants={stagger(0.08)} {...reveal} className="relative mx-auto max-w-2xl">
      <span
        className="absolute top-2 bottom-2 left-[19px] w-px bg-border sm:left-[27px]"
        aria-hidden="true"
      />
      {entries.map((e, i) => (
        <motion.li key={i} variants={fadeUp} className="relative flex gap-5 pb-8 last:pb-0">
          <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-fg shadow-card sm:h-14 sm:w-14 sm:text-sm">
            {e.marker}
          </div>
          <div className={`pt-1 sm:pt-3 ${e.muted ? 'opacity-70' : ''}`}>
            <h4 className="font-semibold text-heading">{e.title}</h4>
            {e.body && <p className="mt-1 text-sm leading-relaxed text-content">{e.body}</p>}
          </div>
        </motion.li>
      ))}
    </motion.ol>
  )
}
