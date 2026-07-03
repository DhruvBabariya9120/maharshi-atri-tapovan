import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'
import { fadeUp } from '../../lib/motion'

export type Stat = {
  value: number
  prefix?: string
  suffix?: string
  label: string
  display?: string // overrides the animated number (e.g. "P–10")
  isYear?: boolean
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
    <motion.div variants={fadeUp} className="flex flex-col items-center text-center">
      <div className="text-4xl font-extrabold tracking-tight text-heading sm:text-5xl">
        {stat.prefix}
        {stat.display ? stat.display : <CountUp to={stat.value} isYear={stat.isYear} />}
        {stat.suffix}
      </div>
      <div className="mt-2 text-sm font-medium text-content">{stat.label}</div>
    </motion.div>
  )
}
