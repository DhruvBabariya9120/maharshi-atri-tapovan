import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

export type DayEntry = {
  marker: string // time, e.g. "05:15"
  title: string
}

/**
 * Scroll-progress timeline: a gradient spine fills as the user scrolls, nodes
 * pop in when they enter view, and cards alternate left/right on desktop.
 */
export function DayTimeline({ entries }: { entries: DayEntry[] }) {
  const ref = useRef<HTMLOListElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.55'],
  })
  const scaleY = useTransform(scrollYProgress, [0, 1], [0.02, 1])

  return (
    <ol ref={ref} className="relative mx-auto max-w-3xl">
      {/* static track */}
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-5 w-0.5 -translate-x-1/2 bg-border lg:left-1/2"
      />
      {/* gradient progress spine (scroll-linked) */}
      <motion.span
        aria-hidden="true"
        style={{ scaleY: reduce ? 1 : scaleY }}
        className="absolute top-1 bottom-1 left-5 w-0.5 origin-top -translate-x-1/2 bg-linear-to-b from-brand via-violet-500 to-accent lg:left-1/2"
      />

      {entries.map((e, i) => {
        const left = i % 2 === 0
        return (
          <li
            key={i}
            className="relative pb-9 last:pb-0 lg:grid lg:grid-cols-2 lg:gap-x-12"
          >
            {/* node — wrapper handles positioning so the scale animation can't clobber the translate */}
            <span className="absolute top-0 left-5 z-10 -translate-x-1/2 lg:left-1/2">
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 18 }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-brand to-accent text-[11px] font-bold text-white shadow-card lg:h-14 lg:w-14 lg:text-sm"
              >
                {e.marker}
              </motion.span>
            </span>

            {/* card */}
            <motion.div
              initial={{ opacity: 0, x: reduce ? 0 : left ? -24 : 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`ml-16 lg:ml-0 ${
                left ? 'lg:col-start-1 lg:pr-16 lg:text-right' : 'lg:col-start-2 lg:pl-16'
              }`}
            >
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card transition-shadow duration-300 hover:shadow-lift">
                <h4 className="font-semibold text-heading">{e.title}</h4>
              </div>
            </motion.div>
          </li>
        )
      })}
    </ol>
  )
}
