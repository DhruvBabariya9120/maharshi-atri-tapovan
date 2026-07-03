import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import { fadeUp } from '../../lib/motion'
import { Icon } from '../../lib/icons'

export type Stat = {
  value: number
  prefix?: string
  suffix?: string
  label: string
  display?: string // overrides the animated number (e.g. "P–10")
  isYear?: boolean
  icon?: string
}

function CountUp({ to, isYear }: { to: number; isYear?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => setVal(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, to])

  return <span ref={ref}>{isYear ? val : val.toLocaleString('en-IN')}</span>
}

export function StatCounter({ stat }: { stat: Stat }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group flex h-full flex-col items-center rounded-2xl border border-border bg-card px-4 py-7 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift"
    >
      {stat.icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-tint-blue text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-fg">
          <Icon name={stat.icon} className="h-6 w-6" />
        </div>
      )}
      <div className="font-display text-3xl font-extrabold tracking-tight text-brand tabular-nums sm:text-4xl">
        {stat.prefix}
        {stat.display ? stat.display : <CountUp to={stat.value} isYear={stat.isYear} />}
        {stat.suffix}
      </div>
      <div className="mt-2 text-sm font-medium leading-snug text-content">{stat.label}</div>
    </motion.div>
  )
}
